"use client"

// HUD is driven ONLY by bridge events (plan §12) — React never reads Pixi or
// room state directly, and nothing here updates at frame rate.
// Auth gate: no access token -> login/signup form; token -> mount world.

import { useEffect, useRef, useState } from "react"
import { bridge } from "../lib/bridge"
import { login, signup, clearTokens, getAccessToken } from "../lib/auth"
import { startMediaWatcher } from "../lib/media"

type ChatMsg = { from: string; text: string; ts: number }

const hudBox: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 4,
  background: "rgba(0,0,0,.6)",
  color: "#fff",
  fontFamily: "monospace",
  fontSize: 13,
}

function AuthForm({ onToken }: { onToken: (token: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (fn: typeof login) => {
    setBusy(true)
    setError("")
    try {
      const { accessToken } = await fn(email, password)
      onToken(accessToken)
    } catch (e) {
      setError(e instanceof Error ? e.message : "auth failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ ...hudBox, width: 280, margin: "20vh auto 0", padding: 16 }}>
      <div style={{ marginBottom: 8 }}>sign in to enter the world</div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        type="email"
        style={{ width: "100%", marginBottom: 6, padding: "4px 6px" }}
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        type="password"
        style={{ width: "100%", marginBottom: 8, padding: "4px 6px" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={busy} onClick={() => submit(login)}>log in</button>
        <button disabled={busy} onClick={() => submit(signup)}>sign up</button>
      </div>
      {error && <div style={{ color: "#f66", marginTop: 8 }}>{error}</div>}
    </div>
  )
}

export default function Page() {
  const mount = useRef<HTMLDivElement>(null)
  const world = useRef<import("../lib/world").WorldHandle | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false) // avoids SSR/localStorage mismatch
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [sessionId, setSessionId] = useState("")
  const [zoneId, setZoneId] = useState("")
  const [mediaZone, setMediaZone] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [draft, setDraft] = useState("")

  useEffect(() => {
    setToken(getAccessToken())
    setReady(true)
  }, [])

  useEffect(() => {
    const offs = [
      bridge.on("net:connected", ({ sessionId }) => {
        setSessionId(sessionId)
        setStatus("connected")
      }),
      bridge.on("net:disconnected", () => setStatus("disconnected")),
      bridge.on("player:zone-changed", ({ zoneId }) => setZoneId(zoneId)),
      bridge.on("media:connected", ({ zoneId }) => setMediaZone(zoneId)),
      bridge.on("media:disconnected", () => setMediaZone("")),
      bridge.on("chat:message", (msg) => setMessages((m) => [...m, msg].slice(-50))),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const stopMedia = startMediaWatcher()
    // dynamic import keeps pixi/colyseus out of SSR
    import("../lib/world")
      .then((m) => m.createWorld(mount.current!, token))
      .then((h) => {
        if (cancelled) h.destroy()
        else world.current = h
      })
      .catch((err) => {
        console.error("world failed to start", err)
        // join rejected (expired/invalid token) -> clear and fall back to the form
        clearTokens()
        if (!cancelled) setToken(null)
      })
    return () => {
      cancelled = true
      stopMedia()
      world.current?.destroy()
      world.current = null
    }
  }, [token])

  const sendChat = () => {
    const text = draft.trim()
    if (!text || !world.current) return
    world.current.sendChat(text)
    setDraft("")
  }

  if (!ready) return null
  if (!token) return <AuthForm onToken={setToken} />

  return (
    <main>
      <div ref={mount} />
      <div style={{ ...hudBox, position: "fixed", top: 8, left: 8 }}>
        <div>
          net: {status}
          {sessionId ? ` (${sessionId})` : ""}
        </div>
        <div>zone: {zoneId || "none"}</div>
        <div>voice: {mediaZone || "off"}</div>
      </div>
      <div style={{ ...hudBox, position: "fixed", bottom: 8, left: 8, width: 320, padding: 8 }}>
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
