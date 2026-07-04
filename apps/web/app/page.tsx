"use client"

// HUD is driven ONLY by bridge events (plan §12) — React never reads Pixi or
// room state directly, and nothing here updates at frame rate.
// Auth gate: no access token -> login/signup form; token -> mount world.

import { useEffect, useRef, useState } from "react"
import { SPIKE_ZONES } from "@repo/net-schema/zones"
import { QUESTS } from "@repo/net-schema/xp"
import { bridge } from "../lib/bridge"
import { login, signup, refresh, clearTokens, getAccessToken, GATEWAY } from "../lib/auth"
import { startMediaWatcher } from "../lib/media"

const AI = process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:2570"

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

type FriendsData = {
  friends: { userId: string; handle: string | null; online: boolean }[]
  pending: {
    incoming: { id: string; handle: string | null }[]
    outgoing: { id: string; handle: string | null }[]
  }
}

// ponytail: 15s polling while mounted — push updates via room broadcast later
function FriendsPanel() {
  const [data, setData] = useState<FriendsData | null>(null)
  const [handle, setHandle] = useState("")
  const [error, setError] = useState("")

  const authed = (path: string, init?: RequestInit) =>
    fetch(`${GATEWAY}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        authorization: `Bearer ${getAccessToken()}`,
      },
    })

  const load = () =>
    authed("/v1/friends")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d as FriendsData))
      .catch(() => {})

  useEffect(() => {
    void load()
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addFriend = async () => {
    const h = handle.trim()
    if (!h) return
    setError("")
    const res = await authed("/v1/friends/request", { method: "POST", body: JSON.stringify({ handle: h }) })
    if (res.ok) {
      setHandle("")
      void load()
    } else {
      setError(await res.json().then((j) => (j as { error?: string }).error ?? "failed").catch(() => "failed"))
    }
  }

  const respond = async (requestId: string, accept: boolean) => {
    await authed("/v1/friends/respond", { method: "POST", body: JSON.stringify({ requestId, accept }) })
    void load()
  }

  return (
    <details style={{ ...hudBox, position: "fixed", bottom: 8, right: 8, width: 220, padding: 8 }}>
      <summary style={{ cursor: "pointer" }}>
        friends ({data?.friends.length ?? 0})
        {data?.pending.incoming.length ? ` · ${data.pending.incoming.length} pending` : ""}
      </summary>
      <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 6 }}>
        {data?.friends.map((f) => (
          <div key={f.userId}>
            <span style={{ color: f.online ? "#4f4" : "#888" }}>●</span> {f.handle ?? f.userId}
          </div>
        ))}
        {data?.pending.incoming.map((r) => (
          <div key={r.id}>
            {r.handle ?? "?"} wants to be friends{" "}
            <button onClick={() => respond(r.id, true)}>✓</button>{" "}
            <button onClick={() => respond(r.id, false)}>✕</button>
          </div>
        ))}
        {data?.pending.outgoing.map((r) => (
          <div key={r.id} style={{ opacity: 0.6 }}>
            → {r.handle ?? "?"} (sent)
          </div>
        ))}
      </div>
      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && addFriend()}
        placeholder="add by handle…"
        style={{ width: "100%", marginTop: 6, padding: "2px 4px" }}
      />
      {error && <div style={{ color: "#f66", marginTop: 4 }}>{error}</div>}
    </details>
  )
}

type Leaderboard = {
  top: { rank: number; userId: string; handle: string | null; xp: number; level: number }[]
  me: { rank: number | null; xp: number }
}

// ponytail: fetch on open + 30s poll — push later
function LeaderboardPanel() {
  const [data, setData] = useState<Leaderboard | null>(null)

  useEffect(() => {
    const load = () =>
      fetch(`${GATEWAY}/v1/leaderboard`, {
        headers: { authorization: `Bearer ${getAccessToken()}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setData(d as Leaderboard))
        .catch(() => {})
    void load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <details style={{ ...hudBox, position: "fixed", top: 8, right: 8, width: 220, padding: 8 }}>
      <summary style={{ cursor: "pointer" }}>
        leaderboard{data?.me.rank ? ` · you #${data.me.rank}` : ""}
      </summary>
      <div style={{ marginTop: 6 }}>
        {data?.top.map((u) => (
          <div key={u.userId}>
            #{u.rank} {u.handle ?? u.userId.slice(0, 8)} — lv {u.level} · {u.xp} xp
          </div>
        ))}
      </div>
    </details>
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
  const [xp, setXp] = useState({ xp: 0, level: 1 })
  const [questStep, setQuestStep] = useState(0)
  const [streak, setStreak] = useState(0)
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
      bridge.on("player:xp-changed", setXp),
      bridge.on("player:quest-changed", ({ questStep }) => setQuestStep(questStep)),
      bridge.on("player:streak-changed", ({ streak }) => setStreak(streak)),
      // ponytail: level-up shown as a chat panel line — dedicated toast later
      bridge.on("player:level-up", ({ level }) =>
        setMessages((m) =>
          [...m, { from: "system", text: `you reached level ${level}`, ts: Date.now() }].slice(-50),
        ),
      ),
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
      .then(async (m) => {
        try {
          return await m.createWorld(mount.current!, token)
        } catch (err) {
          // access token likely expired (15m) — rotate via refresh token and retry once
          const pair = await refresh()
          if (!pair) throw err
          return m.createWorld(mount.current!, pair.accessToken)
        }
      })
      .then((h) => {
        if (cancelled) h.destroy()
        else world.current = h
      })
      .catch((err) => {
        console.error("world failed to start", err)
        // join + refresh both failed -> clear and fall back to the form
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

  const inMeeting = SPIKE_ZONES.find((z) => z.id === zoneId)?.kind === "meeting"
  const [notesBusy, setNotesBusy] = useState(false)
  const requestNotes = async () => {
    // ponytail: transcript = this client's chat log (last 50); server-side
    // capture + audio/STT is the upgrade path (plan §13)
    const chat = messages.filter((m) => m.from !== "system")
    if (!chat.length || notesBusy) return
    setNotesBusy(true)
    try {
      const res = await fetch(`${AI}/v1/ai/notes`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${getAccessToken()}` },
        body: JSON.stringify({ zoneId, messages: chat }),
      })
      const now = Date.now()
      if (res.ok) {
        const notes = (await res.json()) as { summary: string; actionItems: string[]; decisions: string[] }
        const lines = [
          `📝 ${notes.summary}`,
          ...notes.decisions.map((d) => `✔ decision: ${d}`),
          ...notes.actionItems.map((a) => `→ action: ${a}`),
        ]
        setMessages((m) => [...m, ...lines.map((text, i) => ({ from: "system", text, ts: now + i }))].slice(-50))
      } else {
        const err = await res.json().then((j) => (j as { error?: string }).error).catch(() => null)
        setMessages((m) => [...m, { from: "system", text: `notes failed: ${err ?? res.status}`, ts: now }].slice(-50))
      }
    } finally {
      setNotesBusy(false)
    }
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
          {status === "disconnected" && (
            <button onClick={() => location.reload()} style={{ marginLeft: 8 }}>reconnect</button>
          )}
        </div>
        <div>
          zone: {zoneId || "none"}
          {inMeeting && (
            <button onClick={requestNotes} disabled={notesBusy} style={{ marginLeft: 8 }}>
              {notesBusy ? "…" : "📝 notes"}
            </button>
          )}
        </div>
        <div>
          lv {xp.level} · xp {xp.xp}
          {streak > 0 && <span> · 🔥{streak}</span>}
        </div>
        <div>quest: {QUESTS[questStep]?.text ?? "all done ✓"}</div>
        <div>voice: {mediaZone || "off"}</div>
      </div>
      <FriendsPanel />
      <LeaderboardPanel />
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
