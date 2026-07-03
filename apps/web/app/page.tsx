"use client"

// HUD is driven ONLY by bridge events (plan §12) — React never reads Pixi or
// room state directly, and nothing here updates at frame rate.

import { useEffect, useRef, useState } from "react"
import { bridge } from "../lib/bridge"

export default function Page() {
  const mount = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [sessionId, setSessionId] = useState("")
  const [zoneId, setZoneId] = useState("")

  useEffect(() => {
    const offs = [
      bridge.on("net:connected", ({ sessionId }) => {
        setSessionId(sessionId)
        setStatus("connected")
      }),
      bridge.on("net:disconnected", () => setStatus("disconnected")),
      bridge.on("player:zone-changed", ({ zoneId }) => setZoneId(zoneId)),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    // dynamic import keeps pixi/colyseus out of SSR
    let destroy: (() => void) | undefined
    let cancelled = false
    import("../lib/world")
      .then((m) => m.createWorld(mount.current!))
      .then((d) => {
        if (cancelled) d()
        else destroy = d
      })
      .catch((err) => console.error("world failed to start", err))
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [])

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
    </main>
  )
}
