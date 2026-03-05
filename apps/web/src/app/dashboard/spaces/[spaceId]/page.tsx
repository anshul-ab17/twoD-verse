"use client"

import { FormEvent, useCallback, useEffect, useRef, useState } from "react"
import type Phaser from "phaser"
import { useParams } from "next/navigation"
import { useSpaceSidebar } from "@/components/sidebar/SpaceSidebarContext"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { getWebSocketUrl } from "@/lib/api"
import { MapPinned, Send } from "lucide-react"

type PlayerStateEvent = {
  x: number
  y: number
  roomId: number
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

type IncomingRealtimeMessage =
  | ProximityUpdateMessage
  | WebRTCMessage
  | PlayerLeftMessage

export default function SpacePage() {
  const params = useParams<{ spaceId?: string }>()
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
  const remoteAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const [statusText, setStatusText] = useState("init: waiting")
  const [realtimeStatus, setRealtimeStatus] = useState("realtime: disconnected")
  const [draft, setDraft] = useState("")
  const [connectedVoicePeers, setConnectedVoicePeers] = useState(0)
  const showChatPanel = activePane === "chat"

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

    const audio = remoteAudioRef.current.get(userId)
    if (audio) {
      audio.pause()
      audio.srcObject = null
      remoteAudioRef.current.delete(userId)
    }

    setConnectedVoicePeers(peersRef.current.size)
  }, [])

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })
      localStreamRef.current = stream
      return stream
    } catch {
      return null
    }
  }, [])

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
    if (status !== "authenticated" || !spaceId) return

    const ws = new WebSocket(getWebSocketUrl())
    const peers = peersRef.current
    wsRef.current = ws
    setRealtimeStatus("realtime: connecting")

    ws.onopen = () => {
      setRealtimeStatus("realtime: connected")
      sendSocketMessage({ type: "space:join", spaceId })
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as IncomingRealtimeMessage
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
        }
      } catch (error) {
        console.error("WS message parse failed", error)
      }
    }

    ws.onerror = () => {
      setRealtimeStatus("realtime: error")
    }

    ws.onclose = () => {
      setRealtimeStatus("realtime: disconnected")
      wsRef.current = null

      Array.from(peers.keys()).forEach((userId) => {
        destroyPeer(userId)
      })
    }

    const handlePlayerState = (event: Event) => {
      const customEvent = event as CustomEvent<PlayerStateEvent>
      const detail = customEvent.detail
      if (!detail) return

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

    window.addEventListener("twodverse:player-state", handlePlayerState as EventListener)

    return () => {
      window.removeEventListener("twodverse:player-state", handlePlayerState as EventListener)
      ws.close()

      Array.from(peers.keys()).forEach((userId) => {
        destroyPeer(userId)
      })

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
    }
  }, [
    destroyPeer,
    handleProximityUpdate,
    handleWebRTCSignal,
    sendSocketMessage,
    spaceId,
    status,
  ])

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft("")
  }

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
            <div className="absolute left-3 top-[4.25rem] z-10 rounded bg-black/70 px-2 py-1 text-xs text-yellow-200">
              Nearby voice: {connectedVoicePeers}
            </div>
          )}

          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden rounded-xl"
          />
        </div>

        {showChatPanel && (
          <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-[21rem] border-l border-[#6b4b2a] bg-[#1f140c]/95 backdrop-blur-sm lg:relative lg:max-w-none lg:w-[21rem]">
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
