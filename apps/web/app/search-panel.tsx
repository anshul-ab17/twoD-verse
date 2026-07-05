"use client"

// Semantic search over world chat (plan §13). Self-contained: own BYOK Voyage
// key (localStorage, mirrors the anthropicKey pattern), own fetch to the
// gateway. world-app.tsx only imports + renders <SearchPanel />.
import { useEffect, useState } from "react"
import { GATEWAY, getAccessToken } from "../lib/auth"

type Hit = {
  id: string
  text: string
  handle: string | null
  userId: string
  createdAt: string
  score: number
}

const box: React.CSSProperties = {
  position: "fixed",
  bottom: 8,
  right: 8,
  width: 280,
  padding: "6px 10px",
  borderRadius: 4,
  background: "rgba(0,0,0,.6)",
  color: "#fff",
  fontFamily: "monospace",
  fontSize: 13,
}

export function SearchPanel() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // BYOK: user's own Voyage key, browser-only, sent per-request (never stored server-side)
  const [voyageKey, setVoyageKey] = useState("")
  useEffect(() => setVoyageKey(localStorage.getItem("voyageKey") ?? ""), [])
  const saveKey = (k: string) => {
    setVoyageKey(k)
    localStorage.setItem("voyageKey", k)
  }

  const search = async () => {
    const query = q.trim()
    if (!query || busy) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`${GATEWAY}/v1/search?q=${encodeURIComponent(query)}`, {
        headers: {
          authorization: `Bearer ${getAccessToken()}`,
          ...(voyageKey ? { "x-voyage-key": voyageKey } : {}),
        },
      })
      if (res.ok) {
        setHits(((await res.json()) as { results: Hit[] }).results)
      } else {
        const msg = await res.json().then((j) => (j as { error?: string }).error).catch(() => null)
        setHits([])
        setError(msg ?? `search failed (${res.status})`)
      }
    } catch {
      setError("search failed (network)")
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ ...box, width: "auto", cursor: "pointer" }}>
        🔎 search
      </button>
    )
  }

  return (
    <div style={box}>
      <div style={{ display: "flex", gap: 4 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="search chat…"
          style={{ flex: 1, minWidth: 0, padding: "1px 4px" }}
        />
        <button onClick={() => void search()} disabled={busy}>{busy ? "…" : "go"}</button>
        <button onClick={() => setOpen(false)}>×</button>
      </div>
      <input
        value={voyageKey}
        onChange={(e) => saveKey(e.target.value)}
        placeholder="apni Voyage API key…"
        type="password"
        style={{ width: "100%", marginTop: 4, padding: "1px 4px" }}
      />
      {error && <div style={{ color: "#f88", marginTop: 4 }}>{error}</div>}
      <div style={{ maxHeight: 200, overflowY: "auto", marginTop: 4 }}>
        {hits.map((h) => (
          <div key={h.id} style={{ marginTop: 4, borderTop: "1px solid rgba(255,255,255,.2)", paddingTop: 4 }}>
            <div style={{ opacity: 0.7, fontSize: 11 }}>
              {h.handle ?? h.userId.slice(0, 8)} · {new Date(h.createdAt).toLocaleString()} ·{" "}
              {(h.score * 100).toFixed(0)}%
            </div>
            <div>{h.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
