"use client"

// HUD is driven ONLY by bridge events (plan §12) — React never reads Pixi or
// room state directly, and nothing here updates at frame rate.

import { useEffect, useRef, useState } from "react"
import { bridge } from "../lib/bridge"

type ChatMsg = { from: string; text: string; ts: number }

export default function Page() {
  const mount = useRef<HTMLDivElement>(null)
  const world = useRef<import("../lib/world").WorldHandle | null>(null)
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [sessionId, setSessionId] = useState("")
  const [zoneId, setZoneId] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState("")

  useEffect(() => {
    const offs = [
      bridge.on("net:connected", ({ sessionId }) => {
        setSessionId(sessionId)
        setStatus("connected")
      }),
      bridge.on("net:disconnected", () => setStatus("disconnected")),
      bridge.on("player:zone-changed", ({ zoneId }) => setZoneId(zoneId)),
      bridge.on("chat:message", (msg) => setMessages((m) => [...m, msg].slice(-50))),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    // dynamic import keeps pixi/colyseus out of SSR
    let cancelled = false
    import("../lib/world")
      .then((m) => m.createWorld(mount.current!))
      .then((h) => {
        if (cancelled) h.destroy()
        else world.current = h
      })
      .catch((err) => console.error("world failed to start", err))
    return () => {
      cancelled = true
      world.current?.destroy()
      world.current = null
    }
  }, [])

  const sendChat = () => {
    const text = draft.trim()
    if (!text || !world.current) return
    world.current.sendChat(text)
    setDraft("")
  }

  return (
    <main>
      <div ref={mount} />
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          padding: "6px 10px",
          borderRadius: 4,
          background: "rgba(0,0,0,.6)",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <div>
          net: {status}
          {sessionId ? ` (${sessionId})` : ""}
        </div>
        <div>zone: {zoneId || "none"}</div>
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 8,
          left: 8,
          width: 320,
          padding: 8,
          borderRadius: 4,
          background: "rgba(0,0,0,.6)",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <div style={{ maxHeight: 160, overflowY: "auto" }}>
          {messages.map((m) => (
            <div key={`${m.from}-${m.ts}`}>
              <span style={{ opacity: 0.6 }}>{m.from === sessionId ? "you" : m.from}: </span>
              {m.text}
            </div>
          ))}
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat()}
          placeholder="chat…"
          maxLength={500}
          style={{
            width: "100%",
            marginTop: 6,
            padding: "4px 6px",
            border: "1px solid #444",
            borderRadius: 3,
            background: "rgba(255,255,255,.1)",
            color: "#fff",
            fontFamily: "inherit",
            fontSize: "inherit",
          }}
        />
      </div>
    </main>
  )
}
