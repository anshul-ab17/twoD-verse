"use client"

// Game view (spec §5). HUD driven ONLY by bridge events — React never reads
// Pixi or room state directly; nothing updates at frame rate.
// ponytail: single global WorldRoom today — [hash] selects the verse in the
// dashboard sense only; per-verse rooms are a future realtime task.

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SPIKE_ZONES } from "@repo/game-core/zones"
import { QUESTS } from "@repo/game-core/xp"
import { bridge } from "../../../lib/bridge"
import { refresh, clearTokens, getAccessToken, GATEWAY } from "../../../lib/auth"
import { startMediaWatcher, setMic, setCam } from "../../../lib/media"
import { toggleAmbient } from "../../../lib/ambient"
import { useAuthGuard } from "../../../lib/use-auth-guard"
import { GameShell, VideoTile, type PanelTab, type ChatMsg } from "../../_components/game/game-shell"
import { SearchPanel } from "../../_components/game/search-panel"

const AI = process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:2570"

type FriendsData = {
  friends: { userId: string; handle: string | null; online: boolean }[]
  pending: {
    incoming: { id: string; handle: string | null }[]
    outgoing: { id: string; handle: string | null }[]
  }
}

const authedFetch = (path: string, init?: RequestInit) =>
  fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      authorization: `Bearer ${getAccessToken()}`,
    },
  })

export default function GamePage() {
  const token = useAuthGuard()
  const router = useRouter()
  const mount = useRef<HTMLDivElement>(null)
  const world = useRef<import("../../../lib/world").WorldHandle | null>(null)

  const [tab, setTab] = useState<PanelTab | null>(null)
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting")
  const [sessionId, setSessionId] = useState("")
  const [zoneId, setZoneId] = useState("")
  const [xp, setXp] = useState({ xp: 0, level: 1 })
  const [questStep, setQuestStep] = useState(0)
  const [streak, setStreak] = useState(0)
  const [ambient, setAmbient] = useState(false)
  const [mediaZone, setMediaZone] = useState("")
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(false)
  const [tiles, setTiles] = useState<{ identity: string; el: HTMLVideoElement }[]>([])
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [unread, setUnread] = useState(0)

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
      bridge.on("player:level-up", ({ level }) =>
        setNotifications((n) => [`⭐ You reached level ${level}`, ...n].slice(0, 50)),
      ),
      bridge.on("media:connected", ({ zoneId }) => setMediaZone(zoneId)),
      bridge.on("media:disconnected", () => {
        setMediaZone("")
        setTiles([])
      }),
      bridge.on("media:mic-changed", ({ on }) => setMicOn(on)),
      bridge.on("media:cam-changed", ({ on }) => setCamOn(on)),
      bridge.on("media:video-added", ({ identity, el }) =>
        setTiles((t) => [...t.filter((x) => x.identity !== identity), { identity, el }]),
      ),
      bridge.on("media:video-removed", ({ identity }) =>
        setTiles((t) => t.filter((x) => x.identity !== identity)),
      ),
      bridge.on("chat:message", (msg) => {
        setMessages((m) => [...m, msg].slice(-50))
        setUnread((u) => u + 1)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [])

  useEffect(() => {
    if (tab === "chat") setUnread(0)
  }, [tab, messages.length])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    const stopMedia = startMediaWatcher()
    const character = (typeof window !== "undefined" && localStorage.getItem("verse_character")) || "luffy"
    import("../../../lib/world")
      .then(async (m) => {
        try {
          return await m.createWorld(mount.current!, token, character)
        } catch (err) {
          const pair = await refresh()
          if (!pair) throw err
          return m.createWorld(mount.current!, pair.accessToken, character)
        }
      })
      .then((h) => {
        if (cancelled) h.destroy()
        else world.current = h
      })
      .catch((err) => {
        console.error("world failed to start", err)
        clearTokens()
        if (!cancelled) router.replace("/signin?next=" + encodeURIComponent(location.pathname))
      })
    return () => {
      cancelled = true
      stopMedia()
      world.current?.destroy()
      world.current = null
    }
  }, [token, router])

  const [draft, setDraft] = useState("")
  const sendChat = () => {
    const text = draft.trim()
    if (!text || !world.current) return
    world.current.sendChat(text)
    setDraft("")
  }

  const inMeeting = SPIKE_ZONES.find((z) => z.id === zoneId)?.kind === "meeting"
  const [notesBusy, setNotesBusy] = useState(false)
  const [aiKey, setAiKey] = useState("")
  useEffect(() => setAiKey(localStorage.getItem("anthropicKey") ?? ""), [])
  const saveAiKey = (k: string) => {
    setAiKey(k)
    localStorage.setItem("anthropicKey", k)
  }
  const requestNotes = async () => {
    const chat = messages.filter((m) => m.from !== "system")
    if (!chat.length || notesBusy) return
    setNotesBusy(true)
    try {
      const res = await fetch(`${AI}/v1/ai/notes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${getAccessToken()}`,
          ...(aiKey ? { "x-anthropic-key": aiKey } : {}),
        },
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
        const errMsg = await res.json().then((j) => (j as { error?: string }).error).catch(() => null)
        setMessages((m) => [...m, { from: "system", text: `notes failed: ${errMsg ?? res.status}`, ts: now }].slice(-50))
      }
    } finally {
      setNotesBusy(false)
    }
  }

  if (!token) return null

  return (
    <GameShell
      tab={tab}
      onTab={setTab}
      badge={{ chat: tab === "chat" ? 0 : unread }}
      panel={
        tab === "people" ? <PeoplePanel /> :
        tab === "chat" ? (
          <ChatPanel
            messages={messages} sessionId={sessionId} draft={draft} setDraft={setDraft} sendChat={sendChat}
            inMeeting={inMeeting} notesBusy={notesBusy} requestNotes={requestNotes} aiKey={aiKey} saveAiKey={saveAiKey}
          />
        ) :
        tab === "calendar" ? (
          <PanelFrame title="Calendar">
            <p className="p-4 text-sm text-[var(--text-muted)]">No meetings scheduled. Scheduling ships with integrations.</p>
          </PanelFrame>
        ) :
        tab === "notifications" ? <NotificationsPanel notifications={notifications} /> : null
      }
      bottom={
        <>
          <div className="mr-auto flex items-center gap-2 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-dim)] text-xs font-bold text-[var(--accent-bright)]">
              {sessionId ? sessionId.slice(0, 2).toUpperCase() : "…"}
            </span>
            <span className={status === "connected" ? "text-[var(--online)]" : "text-[var(--warn)]"}>●</span>
            <span className="text-[var(--text-secondary)]">
              lv {xp.level} · {xp.xp} xp{streak > 0 ? ` · 🔥${streak}` : ""}
            </span>
          </div>
          {status === "disconnected" && (
            <button onClick={() => location.reload()}
              className="rounded-xl bg-[var(--warn)]/20 px-4 py-2 text-sm text-[var(--warn)] transition-colors duration-200 hover:bg-[var(--warn)]/30">
              Reconnect
            </button>
          )}
          <ControlButton on={micOn} label="🎙" onClick={() => void setMic(!micOn)} title="Toggle microphone" />
          <ControlButton on={camOn} label="📷" onClick={() => void setCam(!camOn)} title="Toggle camera" />
          <ControlButton on={ambient} label={ambient ? "🔊" : "🔈"} onClick={() => void toggleAmbient().then(setAmbient)} title="Ambient sound" />
          <div className="mr-2 text-xs text-[var(--text-muted)]">{mediaZone ? `voice: ${mediaZone}` : ""}</div>
          <button onClick={() => router.push("/verse")}
            className="ml-auto rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700">
            🚪 Leave
          </button>
        </>
      }
      overlay={
        <>
          <SearchPanel />
          {zoneId && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-opacity duration-300">
              {zoneId}
            </div>
          )}
          <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
            quest: {QUESTS[questStep]?.text ?? "all done ✓"}
          </div>
          {tiles.length > 0 && (
            <div className="absolute left-1/2 top-4 flex max-w-[540px] -translate-x-1/2 flex-wrap justify-center gap-2">
              {tiles.map((t) => (
                <VideoTile key={t.identity} identity={t.identity} el={t.el} />
              ))}
            </div>
          )}
        </>
      }
    >
      <div ref={mount} className="h-full w-full" />
    </GameShell>
  )
}

function ControlButton({ on, label, onClick, title }: {
  on: boolean; label: string; onClick: () => void; title: string
}) {
  return (
    <button onClick={onClick} title={title}
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg transition-colors duration-200 ${
        on ? "bg-[var(--bg-elevated)] hover:bg-zinc-700" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
      }`}>
      {label}
    </button>
  )
}

function PanelFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-[var(--border-subtle)] px-4 py-3 text-sm font-semibold">{title}</div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </>
  )
}

// People tab: absorbs old FriendsPanel (15s poll while mounted — push later).
function PeoplePanel() {
  const [data, setData] = useState<FriendsData | null>(null)
  const [handle, setHandle] = useState("")
  const [error, setError] = useState("")

  const load = () =>
    authedFetch("/v1/friends")
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
    const res = await authedFetch("/v1/friends/request", { method: "POST", body: JSON.stringify({ handle: h }) })
    if (res.ok) {
      setHandle("")
      void load()
    } else {
      setError(await res.json().then((j) => (j as { error?: string }).error ?? "failed").catch(() => "failed"))
    }
  }

  const respond = async (requestId: string, accept: boolean) => {
    await authedFetch("/v1/friends/respond", { method: "POST", body: JSON.stringify({ requestId, accept }) })
    void load()
  }

  return (
    <PanelFrame title="People">
      <div className="m-3 rounded-xl border border-violet-500/20 bg-[var(--accent-dim)] p-4 text-sm">
        <div className="font-medium">Invite teammates</div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">Share an invite link from the dashboard.</div>
      </div>
      <div className="px-4 py-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
        Friends ({data?.friends.length ?? 0})
      </div>
      {data?.friends.map((f) => (
        <div key={f.userId} className="flex items-center gap-2 px-4 py-1.5 text-sm">
          <span className={f.online ? "text-[var(--online)]" : "text-[var(--text-muted)]"}>●</span>
          {f.handle ?? f.userId}
        </div>
      ))}
      {data?.pending.incoming.map((r) => (
        <div key={r.id} className="flex items-center gap-2 px-4 py-1.5 text-sm">
          {r.handle ?? "?"} wants to be friends
          <button onClick={() => respond(r.id, true)} className="rounded px-1.5 hover:bg-[var(--bg-elevated)]">✓</button>
          <button onClick={() => respond(r.id, false)} className="rounded px-1.5 hover:bg-[var(--bg-elevated)]">✕</button>
        </div>
      ))}
      {data?.pending.outgoing.map((r) => (
        <div key={r.id} className="px-4 py-1.5 text-sm opacity-60">→ {r.handle ?? "?"} (sent)</div>
      ))}
      <div className="p-3">
        <input value={handle} onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addFriend()} placeholder="Add by handle…"
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]" />
        {error && <div className="mt-2 text-xs text-[var(--danger)]">{error}</div>}
      </div>
    </PanelFrame>
  )
}

function ChatPanel({
  messages, sessionId, draft, setDraft, sendChat, inMeeting, notesBusy, requestNotes, aiKey, saveAiKey,
}: {
  messages: ChatMsg[]
  sessionId: string
  draft: string
  setDraft: (s: string) => void
  sendChat: () => void
  inMeeting: boolean
  notesBusy: boolean
  requestNotes: () => void
  aiKey: string
  saveAiKey: (k: string) => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages.length])

  return (
    <>
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-3 text-sm font-semibold">
        Chat
        {inMeeting && (
          <>
            <button onClick={requestNotes} disabled={notesBusy}
              className="ml-auto rounded-lg bg-[var(--accent-dim)] px-2.5 py-1 text-xs text-[var(--accent-bright)] transition-colors duration-200 hover:bg-[var(--accent)]/25 disabled:opacity-50">
              {notesBusy ? "…" : "📝 notes"}
            </button>
            {/* BYOK: user's own Anthropic key, localStorage-only, sent per-request */}
            <input value={aiKey} onChange={(e) => saveAiKey(e.target.value)} placeholder="Anthropic key…" type="password"
              className="w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1 text-xs outline-none focus:border-[var(--accent)]" />
          </>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
        {messages.map((m) => (
          <div key={`${m.from}-${m.ts}`} className="py-0.5 text-sm">
            {m.from === "system" ? (
              <span className="text-xs italic text-[var(--text-muted)]">{m.text}</span>
            ) : (
              <>
                <span className="text-xs text-[var(--accent-bright)]">{m.from === sessionId ? "you" : m.from}: </span>
                {m.text}
              </>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Say something…" maxLength={500}
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]" />
      </div>
    </>
  )
}

// Notifications tab: level-ups + leaderboard (absorbs old LeaderboardPanel, 30s poll).
function NotificationsPanel({ notifications }: { notifications: string[] }) {
  type Leaderboard = {
    top: { rank: number; userId: string; handle: string | null; xp: number; level: number }[]
    me: { rank: number | null; xp: number }
  }
  const [data, setData] = useState<Leaderboard | null>(null)

  useEffect(() => {
    const load = () =>
      authedFetch("/v1/leaderboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setData(d as Leaderboard))
        .catch(() => {})
    void load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <PanelFrame title="Notifications">
      {notifications.length === 0 && (
        <p className="px-4 py-3 text-sm text-[var(--text-muted)]">Nothing yet — go earn some XP.</p>
      )}
      {notifications.map((n, i) => (
        <div key={i} className="px-4 py-1.5 text-sm">{n}</div>
      ))}
      <div className="mt-2 px-4 py-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
        Leaderboard{data?.me.rank ? ` · you #${data.me.rank}` : ""}
      </div>
      {data?.top.map((u) => (
        <div key={u.userId} className="px-4 py-1 text-sm text-[var(--text-secondary)]">
          #{u.rank} {u.handle ?? u.userId.slice(0, 8)} — lv {u.level} · {u.xp} xp
        </div>
      ))}
    </PanelFrame>
  )
}
