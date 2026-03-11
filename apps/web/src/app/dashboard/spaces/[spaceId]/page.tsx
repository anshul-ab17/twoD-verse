"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import type Phaser from "phaser"
import { useParams, useRouter } from "next/navigation"
import { useSpaceSidebar } from "@/components/sidebar/SpaceSidebarContext"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { getWebSocketUrl } from "@/lib/api"
import {
  Camera, CameraOff, MapPinned, MessageCircle, Mic, MicOff,
  Music2, Send, UserRound, Palette,
} from "lucide-react"
import CharacterPicker from "@/components/game/CharacterPicker"
import { useTheme, THEMES, type ThemeKey } from "@/hooks/useTheme"

//  Types 

type PlayerStateEvent = { x: number; y: number; roomId: number }

type RealtimePlayer = { userId: string; x: number; y: number; roomId: number | null }

type ProximityUpdateMessage = {
  type: "proximity:update"
  targetUserId: string
  isClose: boolean
}

type WebRTCMessage = {
  type: "webrtc:offer" | "webrtc:answer" | "webrtc:ice"
  fromUserId: string
  data: RTCSessionDescriptionInit | RTCIceCandidateInit
}

type PlayerLeftMessage = { type: "player:left"; userId: string }
type PlayerJoinedMessage = { type: "player:joined"; userId: string; x: number; y: number; roomId: number | null }
type PlayerMovedMessage = { type: "player:moved"; userId: string; x: number; y: number; roomId: number | null }
type SpaceStateMessage = { type: "space:state"; players: RealtimePlayer[] }

type IncomingRealtimeMessage =
  | ProximityUpdateMessage
  | WebRTCMessage
  | SpaceStateMessage
  | PlayerJoinedMessage
  | PlayerMovedMessage
  | PlayerLeftMessage

//  StreamVideo 

function StreamVideo({ stream, muted = false, className }: { stream: MediaStream; muted?: boolean; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])
  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />
}

//  ThemeMenu 

function ThemeMenu({
  themeKey,
  onSelect,
  btnBg,
  btnBorder,
  btnText,
}: {
  themeKey: ThemeKey
  onSelect: (key: ThemeKey) => void
  btnBg: string
  btnBorder: string
  btnText: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Change theme"
        className="rounded-full border p-2 transition-colors"
        style={{ background: btnBg, borderColor: btnBorder, color: btnText }}
      >
        <Palette size={16} />
      </button>

      {open && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 min-w-[140px] rounded-xl border p-1 shadow-xl"
          style={{ background: "#111", borderColor: btnBorder }}
        >
          {(Object.values(THEMES) as typeof THEMES[ThemeKey][]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => { onSelect(t.key); setOpen(false) }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:opacity-80"
              style={{
                background: themeKey === t.key ? t.controlBorder : "transparent",
                color: t.btnText,
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

//  SpacePage 

export default function SpacePage() {
  const params = useParams<{ spaceId?: string }>()
  const router = useRouter()
  const spaceId = typeof params?.spaceId === "string" ? params.spaceId : ""

  const {
    activePane,
    currentChatUser,
    threadMessages,
    currentUser,
    sendMessage,
    activatePane,
  } = useSpaceSidebar()

  const { status } = useAuthSession()
  const { themeKey, theme, setTheme } = useTheme()

  //  Character selection   
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("twodverse:character")
  })

  const handleSelectCharacter = useCallback((key: string) => {
    localStorage.setItem("twodverse:character", key)
    setSelectedCharacter(key)
  }, [])

  //  Refs 
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const hasInitGameRef = useRef(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const closeTargetsRef = useRef<Set<string>>(new Set())
  const localStreamRef = useRef<MediaStream | null>(null)
  const localCameraStreamRef = useRef<MediaStream | null>(null)
  const localCameraTrackRef = useRef<MediaStreamTrack | null>(null)
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const videoSendersRef = useRef<Map<string, RTCRtpSender>>(new Map())
  const presenceUserIdsRef = useRef<Set<string>>(new Set())
  const remotePlayersStateRef = useRef<Map<string, RealtimePlayer>>(new Map())
  const latestPlayerStateRef = useRef<PlayerStateEvent | null>(null)
  const micEnabledRef = useRef(true)

  //  UI state 
  const [realtimeStatus, setRealtimeStatus] = useState("disconnected")
  const [draft, setDraft] = useState("")
  const [connectedVoicePeers, setConnectedVoicePeers] = useState(0)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [localVideoPreview, setLocalVideoPreview] = useState<MediaStream | null>(null)
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Array<{ userId: string; stream: MediaStream }>>([])

  const showChatPanel = activePane === "chat"
  const showSpotifyPane = activePane === "spotify"

  //  WebSocket 
  const sendSocketMessage = useCallback((payload: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(payload))
  }, [])

  //  WebRTC 
  const destroyPeer = useCallback((userId: string) => {
    const peer = peersRef.current.get(userId)
    if (peer) {
      peer.onicecandidate = null
      peer.ontrack = null
      peer.onconnectionstatechange = null
      peer.close()
      peersRef.current.delete(userId)
    }
    videoSendersRef.current.delete(userId)

    const audio = remoteAudioRef.current.get(userId)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      remoteAudioRef.current.delete(userId)
    }

    setRemoteVideoStreams((prev) => prev.filter((e) => e.userId !== userId))
    setConnectedVoicePeers(peersRef.current.size)
  }, [])

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      stream.getAudioTracks().forEach((t) => { t.enabled = micEnabledRef.current })
      localStreamRef.current = stream
      return stream
    } catch {
      return null
    }
  }, [])

  const ensureCameraTrack = useCallback(async () => {
    const existing = localCameraTrackRef.current
    if (existing && existing.readyState === "live") return existing
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      const [track] = stream.getVideoTracks()
      if (!track) { stream.getTracks().forEach((t) => t.stop()); return null }
      localCameraStreamRef.current = stream
      localCameraTrackRef.current = track
      setLocalVideoPreview(stream)
      return track
    } catch {
      return null
    }
  }, [])

  const stopCameraTrack = useCallback(() => {
    localCameraTrackRef.current?.stop()
    localCameraTrackRef.current = null
    localCameraStreamRef.current?.getTracks().forEach((t) => t.stop())
    localCameraStreamRef.current = null
    setLocalVideoPreview(null)
  }, [])

  const replaceVideoTrackForPeers = useCallback(async (track: MediaStreamTrack | null) => {
    await Promise.all(
      Array.from(videoSendersRef.current.values()).map(async (sender) => {
        try { await sender.replaceTrack(track) } catch { /* ignore */ }
      })
    )
  }, [])

  useEffect(() => {
    micEnabledRef.current = micEnabled
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = micEnabled })
  }, [micEnabled])

  const createPeer = useCallback(async (targetUserId: string, initiator: boolean) => {
    const existing = peersRef.current.get(targetUserId)
    if (existing) return existing

    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
    peersRef.current.set(targetUserId, peer)
    setConnectedVoicePeers(peersRef.current.size)

    const videoSender = peer.addTransceiver("video", { direction: "sendrecv" }).sender
    videoSendersRef.current.set(targetUserId, videoSender)
    if (localCameraTrackRef.current) {
      try { await videoSender.replaceTrack(localCameraTrackRef.current) } catch { /* ignore */ }
    }

    const stream = await ensureLocalStream()
    if (stream) stream.getTracks().forEach((t) => peer.addTrack(t, stream))

    peer.onicecandidate = (event) => {
      if (!event.candidate) return
      sendSocketMessage({ type: "webrtc:ice", targetUserId, candidate: event.candidate.toJSON() })
    }

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (!remoteStream) return

      if (event.track.kind === "video") {
        setRemoteVideoStreams((prev) => {
          const next = prev.filter((e) => e.userId !== targetUserId)
          next.push({ userId: targetUserId, stream: remoteStream })
          return next
        })
      }

      let audio = remoteAudioRef.current.get(targetUserId)
      if (!audio) {
        audio = new Audio()
        audio.autoplay = true
        remoteAudioRef.current.set(targetUserId, audio)
      }
      audio.srcObject = remoteStream
      void audio.play().catch(() => {})
    }

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState
      if (state === "failed" || state === "closed" || state === "disconnected") {
        destroyPeer(targetUserId)
      }
    }

    if (initiator) {
      peer.createDataChannel("proximity")
      const offer = await peer.createOffer()
      await peer.setLocalDescription(offer)
      sendSocketMessage({ type: "webrtc:offer", targetUserId, offer: peer.localDescription })
    }

    return peer
  }, [destroyPeer, ensureLocalStream, sendSocketMessage])

  const handleProximityUpdate = useCallback(async (message: ProximityUpdateMessage) => {
    if (!message.targetUserId) return
    if (!message.isClose) {
      closeTargetsRef.current.delete(message.targetUserId)
      destroyPeer(message.targetUserId)
      return
    }
    closeTargetsRef.current.add(message.targetUserId)
    const shouldInitiate =
      typeof currentUser?.id === "string" &&
      currentUser.id.localeCompare(message.targetUserId) < 0

    if (!peersRef.current.has(message.targetUserId) && shouldInitiate) {
      await createPeer(message.targetUserId, true)
    }
  }, [createPeer, currentUser?.id, destroyPeer])

  const handleWebRTCSignal = useCallback(async (message: WebRTCMessage) => {
    const fromUserId = message.fromUserId
    if (!fromUserId) return

    if (message.type === "webrtc:offer") {
      const peer = await createPeer(fromUserId, false)
      await peer.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit))
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      sendSocketMessage({ type: "webrtc:answer", targetUserId: fromUserId, answer: peer.localDescription })
      return
    }

    const peer = peersRef.current.get(fromUserId)
    if (!peer) return

    if (message.type === "webrtc:answer") {
      await peer.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit))
      return
    }

    await peer.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit))
  }, [createPeer, sendSocketMessage])

  //  Phaser init (once, after character chosen)  
  useEffect(() => {
    if (!selectedCharacter || hasInitGameRef.current) return

    let isMounted = true

    const initGame = async () => {
      if (typeof window === "undefined" || !containerRef.current || gameRef.current) return

      try {
        const Phaser = (await import("phaser")).default
        const MainScene = (await import("@/phaser/main/MainScene")).default

        if (!isMounted) return

        hasInitGameRef.current = true
        gameRef.current = new Phaser.Game({
          type: Phaser.CANVAS,
          width: 1600,
          height: 800,
          parent: containerRef.current,
          backgroundColor: "#1e1e1e",
          physics: { default: "arcade", arcade: { debug: false } },
          audio: { noAudio: true },
          scene: [MainScene],
          scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
          render: { pixelArt: true, antialias: false, roundPixels: true },
        })
      } catch (err) {
        console.error("Phaser init failed:", err)
      }
    }

    void initGame()

    return () => {
      isMounted = false
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
        hasInitGameRef.current = false
      }
    }
  }, [selectedCharacter])

  useEffect(() => {
    if (!showChatPanel) return
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [showChatPanel, threadMessages.length])

  useEffect(() => {
    const handleSceneReady = () => {
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:remote-players:sync", {
          detail: { players: Array.from(remotePlayersStateRef.current.values()) },
        })
      )
    }
    window.addEventListener("twodverse:scene-ready", handleSceneReady)
    return () => window.removeEventListener("twodverse:scene-ready", handleSceneReady)
  }, [])

  //  WebSocket connection   
  useEffect(() => {
    if (status !== "authenticated" || !spaceId) return

    const ws = new WebSocket(getWebSocketUrl())
    const peers = peersRef.current
    wsRef.current = ws
    setRealtimeStatus("connecting")

    const dispatchRemotePlayersSync = (players: RealtimePlayer[]) => {
      remotePlayersStateRef.current = new Map(players.map((p) => [p.userId, p]))
      window.dispatchEvent(new CustomEvent("twodverse:remote-players:sync", { detail: { players } }))
    }

    const dispatchRemotePlayerUpsert = (player: RealtimePlayer) => {
      remotePlayersStateRef.current.set(player.userId, player)
      window.dispatchEvent(new CustomEvent("twodverse:remote-player:upsert", { detail: { player } }))
    }

    const dispatchRemotePlayerLeft = (userId: string) => {
      remotePlayersStateRef.current.delete(userId)
      window.dispatchEvent(new CustomEvent("twodverse:remote-player:left", { detail: { userId } }))
    }

    const emitPresence = () => {
      window.dispatchEvent(
        new CustomEvent("twodverse:presence:update", {
          detail: { userIds: Array.from(presenceUserIdsRef.current) },
        })
      )
    }

    const replacePresence = (userIds: Iterable<string>, opts?: { includeCurrentUser?: boolean }) => {
      const nextIds = new Set<string>()
      for (const id of userIds) if (id) nextIds.add(id)
      if (opts?.includeCurrentUser !== false && currentUser?.id) nextIds.add(currentUser.id)
      presenceUserIdsRef.current = nextIds
      emitPresence()
    }

    const addPresenceUser = (userId: string) => {
      if (!userId || presenceUserIdsRef.current.has(userId)) return
      presenceUserIdsRef.current.add(userId)
      emitPresence()
    }

    const removePresenceUser = (userId: string) => {
      if (!userId || !presenceUserIdsRef.current.has(userId)) return
      presenceUserIdsRef.current.delete(userId)
      emitPresence()
    }

    const sendPlayerMove = (detail: PlayerStateEvent) => {
      const payload: { type: "player:move"; x: number; y: number; roomId?: number } = {
        type: "player:move",
        x: detail.x,
        y: detail.y,
      }
      if (detail.roomId >= 0) payload.roomId = detail.roomId
      sendSocketMessage(payload)
    }

    ws.onopen = () => {
      setRealtimeStatus("connected")
      replacePresence([], { includeCurrentUser: true })
      dispatchRemotePlayersSync([])
      sendSocketMessage({ type: "space:join", spaceId })
      const last = latestPlayerStateRef.current
      if (last) sendPlayerMove(last)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as IncomingRealtimeMessage

        if (message.type === "space:state") {
          const players = message.players.filter((p) => !!p?.userId)
          const remotePlayers = players.filter((p) => p.userId !== currentUser?.id)
          dispatchRemotePlayersSync(remotePlayers)
          replacePresence(players.map((p) => p.userId), { includeCurrentUser: true })
          return
        }

        if (message.type === "player:joined" || message.type === "player:moved") {
          const player: RealtimePlayer = { userId: message.userId, x: message.x, y: message.y, roomId: message.roomId }
          addPresenceUser(player.userId)
          if (player.userId !== currentUser?.id) dispatchRemotePlayerUpsert(player)
          return
        }

        if (message.type === "proximity:update") {
          void handleProximityUpdate(message)
          return
        }

        if (message.type === "webrtc:offer" || message.type === "webrtc:answer" || message.type === "webrtc:ice") {
          void handleWebRTCSignal(message)
          return
        }

        if (message.type === "player:left") {
          closeTargetsRef.current.delete(message.userId)
          destroyPeer(message.userId)
          removePresenceUser(message.userId)
          dispatchRemotePlayerLeft(message.userId)
        }
      } catch (error) {
        console.error("WS parse failed", error)
      }
    }

    ws.onerror = () => setRealtimeStatus("error")

    ws.onclose = (event) => {
      const suffix = event.code ? ` (${event.code})` : ""
      setRealtimeStatus(`disconnected${suffix}`)
      wsRef.current = null
      replacePresence([], { includeCurrentUser: false })
      dispatchRemotePlayersSync([])
      setRemoteVideoStreams([])
      Array.from(peers.keys()).forEach((id) => destroyPeer(id))
    }

    const handlePlayerState = (event: Event) => {
      const detail = (event as CustomEvent<PlayerStateEvent>).detail
      if (!detail) return
      latestPlayerStateRef.current = detail
      sendPlayerMove(detail)
    }

    window.addEventListener("twodverse:player-state", handlePlayerState as EventListener)

    return () => {
      window.removeEventListener("twodverse:player-state", handlePlayerState as EventListener)
      ws.close()
      replacePresence([], { includeCurrentUser: false })
      dispatchRemotePlayersSync([])
      Array.from(peers.keys()).forEach((id) => destroyPeer(id))
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
      setCameraEnabled(false)
      setRemoteVideoStreams([])
      stopCameraTrack()
    }
  }, [
    destroyPeer, handleProximityUpdate, handleWebRTCSignal,
    stopCameraTrack, sendSocketMessage, currentUser?.id, spaceId, status,
  ])

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft("")
  }

  const handleToggleMic = useCallback(async () => {
    const next = !micEnabled
    setMicEnabled(next)
    const stream = await ensureLocalStream()
    stream?.getAudioTracks().forEach((t) => { t.enabled = next })
  }, [ensureLocalStream, micEnabled])

  const handleToggleCamera = useCallback(async () => {
    if (cameraEnabled) {
      setCameraEnabled(false)
      await replaceVideoTrackForPeers(null)
      stopCameraTrack()
      return
    }
    const track = await ensureCameraTrack()
    if (!track) { setCameraEnabled(false); return }
    setCameraEnabled(true)
    await replaceVideoTrackForPeers(track)
  }, [cameraEnabled, ensureCameraTrack, replaceVideoTrackForPeers, stopCameraTrack])

  const handleToggleChat = useCallback(() => {
    activatePane(showChatPanel ? "map" : "chat")
  }, [activatePane, showChatPanel])

  const handleToggleSpotify = useCallback(() => {
    activatePane(showSpotifyPane ? "map" : "spotify")
  }, [activatePane, showSpotifyPane])

  //  Status colour 
  const statusDotColor =
    realtimeStatus === "connected" ? "#4ade80"
    : realtimeStatus === "connecting" ? "#facc15"
    : "#f87171"

  //  Render 
  if (!selectedCharacter) {
    return <CharacterPicker onSelect={handleSelectCharacter} />
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl border"
      style={{ borderColor: theme.containerBorder, background: theme.containerBg }}
    >
      <div className="flex h-full w-full">
        {/*  Game area  */}
        <div className={`${showChatPanel ? "w-full lg:w-[calc(100%-21rem)]" : "w-full"} relative h-full transition-all duration-200`}>

          {/* Status indicator */}
          <div
            className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2 py-1 text-xs"
            style={{ background: `${theme.statusBg}cc`, color: theme.btnText }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusDotColor }} />
            {realtimeStatus}
          </div>

          {connectedVoicePeers > 0 && (
            <div
              className="absolute left-3 top-10 z-10 rounded-full px-2 py-1 text-xs"
              style={{ background: `${theme.statusBg}cc`, color: theme.btnText }}
            >
              🎙 {connectedVoicePeers} nearby
            </div>
          )}

          {/* Video previews */}
          {(localVideoPreview || remoteVideoStreams.length > 0) && (
            <div className="absolute right-3 top-3 z-20 flex max-w-[40vw] flex-wrap justify-end gap-2">
              {localVideoPreview && (
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: theme.controlBorder, background: "#000" }}>
                  <StreamVideo stream={localVideoPreview} muted className="h-20 w-32 object-cover" />
                  <p className="px-2 py-1 text-[10px]" style={{ color: theme.btnText }}>You</p>
                </div>
              )}
              {remoteVideoStreams.map((entry) => (
                <div key={entry.userId} className="overflow-hidden rounded-lg border" style={{ borderColor: theme.controlBorder, background: "#000" }}>
                  <StreamVideo stream={entry.stream} className="h-20 w-32 object-cover" />
                  <p className="px-2 py-1 text-[10px]" style={{ color: theme.btnText }}>{entry.userId.slice(0, 8)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Phaser canvas */}
          <div ref={containerRef} className="h-full w-full overflow-hidden rounded-xl" />

          {/* Control bar */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
            <div
              className="pointer-events-auto flex items-center gap-2 rounded-full border px-2 py-2 shadow-lg backdrop-blur"
              style={{
                background: `${theme.controlBg}ed`,
                borderColor: theme.controlBorder,
              }}
            >
              {/* Mic */}
              <button
                type="button"
                onClick={() => void handleToggleMic()}
                title={micEnabled ? "Mute mic" : "Unmute mic"}
                className="rounded-full border p-2 transition-colors"
                style={micEnabled
                  ? { background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }
                  : { background: "#3a1212", borderColor: "#8b1d1d", color: "#fca5a5" }
                }
              >
                {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>

              {/* Camera */}
              <button
                type="button"
                onClick={() => void handleToggleCamera()}
                title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                className="rounded-full border p-2 transition-colors"
                style={cameraEnabled
                  ? { background: theme.activeBg, borderColor: theme.activeBorder, color: theme.activeText }
                  : { background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }
                }
              >
                {cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
              </button>

              {/* Chat */}
              <button
                type="button"
                onClick={handleToggleChat}
                title={showChatPanel ? "Close chat" : "Open chat"}
                className="rounded-full border p-2 transition-colors"
                style={showChatPanel
                  ? { background: theme.activeBg, borderColor: theme.activeBorder, color: theme.activeText }
                  : { background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }
                }
              >
                <MessageCircle size={16} />
              </button>

              {/* Spotify */}
              <button
                type="button"
                onClick={handleToggleSpotify}
                title={showSpotifyPane ? "Close Spotify" : "Open Spotify"}
                className="rounded-full border p-2 transition-colors"
                style={showSpotifyPane
                  ? { background: "#15803d", borderColor: "#16a34a", color: "#f0fdf4" }
                  : { background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }
                }
              >
                <Music2 size={16} />
              </button>

              {/* Theme picker */}
              <ThemeMenu
                themeKey={themeKey}
                onSelect={setTheme}
                btnBg={theme.btnBg}
                btnBorder={theme.btnBorder}
                btnText={theme.btnText}
              />

              {/* Profile */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/profile")}
                title="Profile"
                className="flex items-center gap-2 rounded-full border px-3 py-2 transition-colors"
                style={{ background: theme.btnBg, borderColor: theme.btnBorder, color: theme.btnText }}
              >
                <UserRound size={16} />
                <span className="text-xs font-medium">{currentUser?.name?.split(" ")[0] || "Profile"}</span>
              </button>
            </div>
          </div>
        </div>

        {/*  Chat panel  */}
        {showChatPanel && (
          <aside
            className="absolute inset-y-0 right-0 z-20 w-full max-w-84 border-l lg:relative lg:max-w-none lg:w-84"
            style={{ background: `${theme.chatBg}f5`, borderColor: theme.chatBorder }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-3 py-3" style={{ borderColor: theme.chatBorder }}>
                <div>
                  <p className="text-xs uppercase tracking-wide" style={{ color: theme.btnText, opacity: 0.7 }}>
                    Current chat
                  </p>
                  <p className="text-sm font-semibold" style={{ color: theme.btnText }}>
                    {currentChatUser?.name || "Space chat"}
                  </p>
                </div>
                <button
                  onClick={() => activatePane("map")}
                  className="rounded-md border p-2 transition-colors"
                  style={{ borderColor: theme.chatBorder, color: theme.btnText }}
                  title="Back to map"
                >
                  <MapPinned size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                {threadMessages.length === 0 ? (
                  <p
                    className="rounded-md border px-3 py-2 text-xs"
                    style={{ borderColor: theme.chatBorder, background: theme.chatMsgBg, color: theme.btnText, opacity: 0.7 }}
                  >
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  threadMessages.map((message) => {
                    const mine = message.fromUserId === currentUser?.id
                    return (
                      <div key={message.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[82%] rounded-lg px-3 py-2 text-sm"
                          style={{
                            background: mine ? theme.chatMsgMineBg : theme.chatMsgBg,
                            color: theme.btnText,
                          }}
                        >
                          <p className="text-[11px] opacity-70">{message.fromUserName}</p>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t p-3" style={{ borderColor: theme.chatBorder }}>
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${currentChatUser?.name || "space"}`}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none"
                    style={{
                      background: theme.chatMsgBg,
                      borderColor: theme.chatBorder,
                      color: theme.btnText,
                    }}
                  />
                  <button
                    type="submit"
                    className="rounded-md p-2 transition-colors"
                    style={{ background: theme.activeBg, color: theme.activeText }}
                    title="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
