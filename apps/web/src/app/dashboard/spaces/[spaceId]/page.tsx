"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import type Phaser from "phaser"
import { useParams, useRouter } from "next/navigation"
import { useSpaceSidebar } from "@/components/sidebar/SpaceSidebarContext"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { getWebSocketUrl } from "@/lib/api"
import { Camera, CameraOff, MapPinned, MessageCircle, Mic, MicOff, Music2, Send, UserRound } from "lucide-react"

type PlayerStateEvent = {
  x: number
  y: number
  roomId: number
}

type RealtimePlayer = {
  userId: string
  x: number
  y: number
  roomId: number | null
}

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

type PlayerLeftMessage = {
  type: "player:left"
  userId: string
}

type PlayerJoinedMessage = {
  type: "player:joined"
  userId: string
  x: number
  y: number
  roomId: number | null
}

type PlayerMovedMessage = {
  type: "player:moved"
  userId: string
  x: number
  y: number
  roomId: number | null
}

type SpaceStateMessage = {
  type: "space:state"
  players: RealtimePlayer[]
}

type IncomingRealtimeMessage =
  | ProximityUpdateMessage
  | WebRTCMessage
  | SpaceStateMessage
  | PlayerJoinedMessage
  | PlayerMovedMessage
  | PlayerLeftMessage

function StreamVideo({
  stream,
  muted = false,
  className,
}: {
  stream: MediaStream
  muted?: boolean
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = stream
  }, [stream])

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />
}

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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
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
  const [statusText, setStatusText] = useState("init: waiting")
  const [realtimeStatus, setRealtimeStatus] = useState("realtime: disconnected")
  const [draft, setDraft] = useState("")
  const [connectedVoicePeers, setConnectedVoicePeers] = useState(0)
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [localVideoPreview, setLocalVideoPreview] = useState<MediaStream | null>(null)
  const [remoteVideoStreams, setRemoteVideoStreams] = useState<Array<{ userId: string; stream: MediaStream }>>([])
  const showChatPanel = activePane === "chat"
  const showSpotifyPane = activePane === "spotify"

  const sendSocketMessage = useCallback((payload: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(payload))
  }, [])

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

    setRemoteVideoStreams((prev) => prev.filter((entry) => entry.userId !== userId))

    setConnectedVoicePeers(peersRef.current.size)
  }, [])

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      stream.getAudioTracks().forEach((track) => {
        track.enabled = micEnabledRef.current
      })
      localStreamRef.current = stream
      return stream
    } catch {
      return null
    }
  }, [])

  const ensureCameraTrack = useCallback(async () => {
    const existing = localCameraTrackRef.current
    if (existing && existing.readyState === "live") {
      return existing
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      const [track] = stream.getVideoTracks()
      if (!track) {
        stream.getTracks().forEach((item) => item.stop())
        return null
      }

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

    if (localCameraStreamRef.current) {
      localCameraStreamRef.current.getTracks().forEach((track) => track.stop())
      localCameraStreamRef.current = null
    }

    setLocalVideoPreview(null)
  }, [])

  const replaceVideoTrackForPeers = useCallback(async (track: MediaStreamTrack | null) => {
    await Promise.all(
      Array.from(videoSendersRef.current.values()).map(async (sender) => {
        try {
          await sender.replaceTrack(track)
        } catch {
          // Ignore per-peer track replacement failures.
        }
      })
    )
  }, [])

  useEffect(() => {
    micEnabledRef.current = micEnabled

    const stream = localStreamRef.current
    if (!stream) return
    stream.getAudioTracks().forEach((track) => {
      track.enabled = micEnabled
    })
  }, [micEnabled])

  const createPeer = useCallback(async (
    targetUserId: string,
    initiator: boolean
  ) => {
    const existing = peersRef.current.get(targetUserId)
    if (existing) {
      return existing
    }

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    })
    peersRef.current.set(targetUserId, peer)
    setConnectedVoicePeers(peersRef.current.size)

    const videoSender = peer.addTransceiver("video", { direction: "sendrecv" }).sender
    videoSendersRef.current.set(targetUserId, videoSender)
    if (localCameraTrackRef.current) {
      try {
        await videoSender.replaceTrack(localCameraTrackRef.current)
      } catch {
        // Keep voice connection even if video attach fails.
      }
    }

    const stream = await ensureLocalStream()
    if (stream) {
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream)
      })
    }

    peer.onicecandidate = (event) => {
      if (!event.candidate) return

      sendSocketMessage({
        type: "webrtc:ice",
        targetUserId,
        candidate: event.candidate.toJSON(),
      })
    }

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (!remoteStream) return

      if (event.track.kind === "video") {
        setRemoteVideoStreams((prev) => {
          const next = prev.filter((entry) => entry.userId !== targetUserId)
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
      sendSocketMessage({
        type: "webrtc:offer",
        targetUserId,
        offer: peer.localDescription,
      })
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
      await peer.setRemoteDescription(
        new RTCSessionDescription(message.data as RTCSessionDescriptionInit)
      )
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      sendSocketMessage({
        type: "webrtc:answer",
        targetUserId: fromUserId,
        answer: peer.localDescription,
      })
      return
    }

    const peer = peersRef.current.get(fromUserId)
    if (!peer) return

    if (message.type === "webrtc:answer") {
      await peer.setRemoteDescription(
        new RTCSessionDescription(message.data as RTCSessionDescriptionInit)
      )
      return
    }

    await peer.addIceCandidate(
      new RTCIceCandidate(message.data as RTCIceCandidateInit)
    )
  }, [createPeer, sendSocketMessage])

  useEffect(() => {
    let isMounted = true

    const initGame = async () => {
      if (typeof window === "undefined") return
      if (gameRef.current) return
      if (!containerRef.current) return

      try {
        setStatusText("init: importing phaser")
        const Phaser = (await import("phaser")).default
        const MainScene = (await import("@/phaser/MainScene")).default

        if (!isMounted) return

        setStatusText("init: creating game")
        gameRef.current = new Phaser.Game({
          type: Phaser.CANVAS,
          width: 1600,
          height: 800,
          parent: containerRef.current,
          backgroundColor: "#1e1e1e",
          physics: {
            default: "arcade",
            arcade: {
              debug: false,
            },
          },
          audio: {
            noAudio: true,
          },
          scene: [MainScene],
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: {
            pixelArt: true,
            antialias: false,
            roundPixels: true,
          },
        })
        setStatusText("")
      } catch (err) {
        setStatusText("init: failed (check console)")
        console.error("Phaser initialization failed:", err)
      }
    }

    initGame()

    return () => {
      isMounted = false

      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!showChatPanel) return
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [showChatPanel, threadMessages.length])

  useEffect(() => {
    const handleSceneReady = () => {
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:remote-players:sync", {
          detail: {
            players: Array.from(remotePlayersStateRef.current.values()),
          },
        })
      )
    }

    window.addEventListener("twodverse:scene-ready", handleSceneReady)
    return () => {
      window.removeEventListener("twodverse:scene-ready", handleSceneReady)
    }
  }, [])

  useEffect(() => {
    if (status !== "authenticated" || !spaceId) return

    const ws = new WebSocket(getWebSocketUrl())
    const peers = peersRef.current
    wsRef.current = ws
    setRealtimeStatus("realtime: connecting")

    const dispatchRemotePlayersSync = (players: RealtimePlayer[]) => {
      remotePlayersStateRef.current = new Map(
        players.map((player) => [player.userId, player])
      )
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:remote-players:sync", {
          detail: { players },
        })
      )
    }

    const dispatchRemotePlayerUpsert = (player: RealtimePlayer) => {
      remotePlayersStateRef.current.set(player.userId, player)
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:remote-player:upsert", {
          detail: { player },
        })
      )
    }

    const dispatchRemotePlayerLeft = (userId: string) => {
      remotePlayersStateRef.current.delete(userId)
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:remote-player:left", {
          detail: { userId },
        })
      )
    }

    const emitPresence = () => {
      if (typeof window === "undefined") return
      window.dispatchEvent(
        new CustomEvent("twodverse:presence:update", {
          detail: { userIds: Array.from(presenceUserIdsRef.current) },
        })
      )
    }

    const replacePresence = (
      userIds: Iterable<string>,
      options?: { includeCurrentUser?: boolean }
    ) => {
      const nextIds = new Set<string>()
      for (const userId of userIds) {
        if (!userId) continue
        nextIds.add(userId)
      }

      if (options?.includeCurrentUser !== false && currentUser?.id) {
        nextIds.add(currentUser.id)
      }

      presenceUserIdsRef.current = nextIds
      emitPresence()
    }

    const addPresenceUser = (userId: string) => {
      if (!userId) return
      if (presenceUserIdsRef.current.has(userId)) return
      presenceUserIdsRef.current.add(userId)
      emitPresence()
    }

    const removePresenceUser = (userId: string) => {
      if (!userId) return
      if (!presenceUserIdsRef.current.has(userId)) return
      presenceUserIdsRef.current.delete(userId)
      emitPresence()
    }

    const sendPlayerMove = (detail: PlayerStateEvent) => {
      const payload: { type: "player:move"; x: number; y: number; roomId?: number } = {
        type: "player:move",
        x: detail.x,
        y: detail.y,
      }

      if (detail.roomId >= 0) {
        payload.roomId = detail.roomId
      }

      sendSocketMessage(payload)
    }

    ws.onopen = () => {
      setRealtimeStatus("realtime: connected")
      replacePresence([], { includeCurrentUser: true })
      dispatchRemotePlayersSync([])
      sendSocketMessage({ type: "space:join", spaceId })

      const lastPlayerState = latestPlayerStateRef.current
      if (lastPlayerState) {
        sendPlayerMove(lastPlayerState)
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as IncomingRealtimeMessage

        if (message.type === "space:state") {
          const players = message.players.filter((player) => !!player?.userId)
          const remotePlayers = players.filter((player) => player.userId !== currentUser?.id)
          dispatchRemotePlayersSync(remotePlayers)
          replacePresence(players.map((player) => player.userId), { includeCurrentUser: true })
          return
        }

        if (message.type === "player:joined" || message.type === "player:moved") {
          const player = {
            userId: message.userId,
            x: message.x,
            y: message.y,
            roomId: message.roomId,
          } satisfies RealtimePlayer

          addPresenceUser(player.userId)
          if (player.userId !== currentUser?.id) {
            dispatchRemotePlayerUpsert(player)
          }
          return
        }

        if (message.type === "proximity:update") {
          void handleProximityUpdate(message)
          return
        }

        if (
          message.type === "webrtc:offer" ||
          message.type === "webrtc:answer" ||
          message.type === "webrtc:ice"
        ) {
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
        console.error("WS message parse failed", error)
      }
    }

    ws.onerror = (event) => {
      setRealtimeStatus("realtime: error")
      console.error("Realtime websocket error", {
        event,
        url: ws.url,
        readyState: ws.readyState,
      })
    }

    ws.onclose = (event) => {
      const closeSuffix = event.code ? ` (${event.code}${event.reason ? `: ${event.reason}` : ""})` : ""
      setRealtimeStatus(`realtime: disconnected${closeSuffix}`)
      wsRef.current = null
      replacePresence([], { includeCurrentUser: false })
      dispatchRemotePlayersSync([])
      setRemoteVideoStreams([])
      console.warn("Realtime websocket closed", { code: event.code, reason: event.reason })

      Array.from(peers.keys()).forEach((userId) => {
        destroyPeer(userId)
      })
    }

    const handlePlayerState = (event: Event) => {
      const customEvent = event as CustomEvent<PlayerStateEvent>
      const detail = customEvent.detail
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

      Array.from(peers.keys()).forEach((userId) => {
        destroyPeer(userId)
      })

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      setCameraEnabled(false)
      setRemoteVideoStreams([])
      stopCameraTrack()
    }
  }, [
    destroyPeer,
    handleProximityUpdate,
    handleWebRTCSignal,
    stopCameraTrack,
    sendSocketMessage,
    currentUser?.id,
    spaceId,
    status,
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
    if (!stream) return

    stream.getAudioTracks().forEach((track) => {
      track.enabled = next
    })
  }, [ensureLocalStream, micEnabled])

  const handleToggleCamera = useCallback(async () => {
    if (cameraEnabled) {
      setCameraEnabled(false)
      await replaceVideoTrackForPeers(null)
      stopCameraTrack()
      return
    }

    const cameraTrack = await ensureCameraTrack()
    if (!cameraTrack) {
      setCameraEnabled(false)
      return
    }

    setCameraEnabled(true)
    await replaceVideoTrackForPeers(cameraTrack)
  }, [cameraEnabled, ensureCameraTrack, replaceVideoTrackForPeers, stopCameraTrack])

  const handleToggleChat = useCallback(() => {
    activatePane(showChatPanel ? "map" : "chat")
  }, [activatePane, showChatPanel])

  const handleToggleSpotify = useCallback(() => {
    activatePane(showSpotifyPane ? "map" : "spotify")
  }, [activatePane, showSpotifyPane])

  const handleOpenProfile = useCallback(() => {
    router.push("/dashboard/profile")
  }, [router])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#3f2a17] bg-[#0b0f19]">
      <div className="flex h-full w-full">
        <div className={`${showChatPanel ? "w-full lg:w-[calc(100%-21rem)]" : "w-full"} relative h-full transition-all duration-200`}>
          <div className="absolute left-3 top-3 z-10 rounded bg-black/70 px-2 py-1 text-xs text-cyan-300">
            {statusText}
          </div>
          <div className="absolute left-3 top-10 z-10 rounded bg-black/70 px-2 py-1 text-xs text-emerald-300">
            {realtimeStatus}
          </div>
          {connectedVoicePeers > 0 && (
            <div className="absolute left-3 top-17 z-10 rounded bg-black/70 px-2 py-1 text-xs text-yellow-200">
              Nearby voice: {connectedVoicePeers}
            </div>
          )}

          {(localVideoPreview || remoteVideoStreams.length > 0) && (
            <div className="absolute right-3 top-3 z-20 flex max-w-[40vw] flex-wrap justify-end gap-2">
              {localVideoPreview && (
                <div className="overflow-hidden rounded-lg border border-[#6b4b2a] bg-black/80">
                  <StreamVideo
                    stream={localVideoPreview}
                    muted
                    className="h-20 w-32 object-cover"
                  />
                  <p className="px-2 py-1 text-[10px] text-yellow-100/80">You</p>
                </div>
              )}

              {remoteVideoStreams.map((entry) => (
                <div key={entry.userId} className="overflow-hidden rounded-lg border border-[#6b4b2a] bg-black/80">
                  <StreamVideo
                    stream={entry.stream}
                    className="h-20 w-32 object-cover"
                  />
                  <p className="px-2 py-1 text-[10px] text-yellow-100/80">{entry.userId.slice(0, 8)}</p>
                </div>
              ))}
            </div>
          )}

          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden rounded-xl"
          />

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#6b4b2a] bg-[#160f0a]/92 px-2 py-2 shadow-lg backdrop-blur">
              <button
                type="button"
                onClick={() => void handleToggleMic()}
                aria-pressed={!micEnabled}
                title={micEnabled ? "Mute microphone" : "Unmute microphone"}
                className={`rounded-full border p-2 transition-colors ${micEnabled ? "border-[#6b4b2a] bg-[#2a1b11] text-yellow-100 hover:bg-[#3a2518]" : "border-[#8b1d1d] bg-[#3a1212] text-red-200 hover:bg-[#4a1919]"}`}
              >
                {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>

              <button
                type="button"
                onClick={() => void handleToggleCamera()}
                aria-pressed={cameraEnabled}
                title={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                className={`rounded-full border p-2 transition-colors ${cameraEnabled ? "border-[#4d6f29] bg-[#243718] text-lime-100 hover:bg-[#2f471f]" : "border-[#6b4b2a] bg-[#2a1b11] text-yellow-100 hover:bg-[#3a2518]"}`}
              >
                {cameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
              </button>

              <button
                type="button"
                onClick={handleToggleChat}
                aria-pressed={showChatPanel}
                title={showChatPanel ? "Close chat" : "Open chat"}
                className={`rounded-full border p-2 transition-colors ${showChatPanel ? "border-[#4d6f29] bg-[#314a20] text-lime-100 hover:bg-[#3c5d28]" : "border-[#6b4b2a] bg-[#2a1b11] text-yellow-100 hover:bg-[#3a2518]"}`}
              >
                <MessageCircle size={16} />
              </button>

              <button
                type="button"
                onClick={handleToggleSpotify}
                aria-pressed={showSpotifyPane}
                title={showSpotifyPane ? "Close Spotify" : "Open Spotify"}
                className={`rounded-full border p-2 transition-colors ${showSpotifyPane ? "border-[#2f8f4e] bg-[#1f4a2e] text-green-100 hover:bg-[#266139]" : "border-[#6b4b2a] bg-[#2a1b11] text-yellow-100 hover:bg-[#3a2518]"}`}
              >
                <Music2 size={16} />
              </button>

              <button
                type="button"
                onClick={handleOpenProfile}
                title="Open profile"
                className="flex items-center gap-2 rounded-full border border-[#6b4b2a] bg-[#2a1b11] px-3 py-2 text-yellow-100 transition-colors hover:bg-[#3a2518]"
              >
                <UserRound size={16} />
                <span className="text-xs font-medium">{currentUser?.name?.split(" ")[0] || "Profile"}</span>
              </button>
            </div>
          </div>
        </div>

        {showChatPanel && (
          <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-84 border-l border-[#6b4b2a] bg-[#1f140c]/95 backdrop-blur-sm lg:relative lg:max-w-none lg:w-84">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#6b4b2a] px-3 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-yellow-300/80">Current chat</p>
                  <p className="text-sm font-semibold text-yellow-100">{currentChatUser?.name || "Space chat"}</p>
                </div>
                <button
                  onClick={() => activatePane("map")}
                  className="rounded-md border border-[#6b4b2a] p-2 text-yellow-200 hover:bg-[#3b2a1a]"
                  title="Back to map"
                >
                  <MapPinned size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                {threadMessages.length === 0 ? (
                  <p className="rounded-md border border-[#6b4b2a] bg-[#2a1b11] px-3 py-2 text-xs text-yellow-300/70">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  threadMessages.map((message) => {
                    const mine = message.fromUserId === currentUser?.id
                    return (
                      <div key={message.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-[#556b2f] text-white" : "bg-[#2a1b11] text-yellow-100"}`}>
                          <p className="text-[11px] opacity-80">{message.fromUserName}</p>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-[#6b4b2a] p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${currentChatUser?.name || "space"}`}
                    className="w-full rounded-md border border-[#6b4b2a] bg-[#1b120c] px-3 py-2 text-sm text-yellow-100 outline-none placeholder:text-yellow-300/50"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-[#556b2f] p-2 text-white hover:bg-[#6b8e23]"
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
