"use client"

// Semantic search over world chat (plan §13). Self-contained: own BYOK Voyage
// key (localStorage, mirrors the anthropicKey pattern), own fetch to the
// gateway. The game page only imports + renders <SearchPanel />.
import { useEffect, useState } from "react"
import { GATEWAY, getAccessToken } from "../../../lib/auth"

type Hit = {
  id: string
  text: string
  handle: string | null
  userId: string
  createdAt: string
  score: number
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
      <button 
        onClick={() => setOpen(true)} 
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-white/10 bg-black/75 hover:bg-black px-4 py-2 text-xs font-mono text-zinc-300 hover:text-white backdrop-blur shadow-lg transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(198,254,30,0.2)] cursor-pointer"
      >
        <span>🔎</span>
        <span>Search Chat</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 rounded-xl border border-white/10 bg-black/90 p-4 text-xs font-mono backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-white/15">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void search()}
          placeholder="Search logs…"
          className="flex-1 min-w-0 rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors duration-200 focus:border-[var(--accent)]"
        />
        <button 
          onClick={() => void search()} 
          disabled={busy}
          className="rounded border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
        >
          {busy ? "…" : "Go"}
        </button>
        <button 
          onClick={() => setOpen(false)}
          className="rounded border border-white/10 bg-white/5 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-200 cursor-pointer"
        >
          ✕
        </button>
      </div>
      
      <input
        value={voyageKey}
        onChange={(e) => saveKey(e.target.value)}
        placeholder="Voyage API Key (stored locally)…"
        type="password"
        className="w-full mt-2 rounded border border-white/5 bg-white/5 px-2 py-1 text-[10px] text-zinc-300 placeholder-zinc-600 outline-none transition-colors duration-200 focus:border-[var(--accent)]"
      />
      
      {error && (
        <div className="mt-2 text-[10px] text-[var(--danger)] bg-[var(--danger)]/5 border border-[var(--danger)]/20 px-2 py-1 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-white/5 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {hits.length === 0 && !error && !busy && q && (
          <p className="text-center text-[10px] text-zinc-500 py-4">No results found</p>
        )}
        {hits.map((h) => (
          <div key={h.id} className="py-2.5 first:pt-0 last:pb-0">
            <div className="text-[9px] text-zinc-500 flex items-center justify-between gap-1 flex-wrap mb-1">
              <span className="text-[var(--accent-bright)] font-semibold">
                @{h.handle ?? h.userId.slice(0, 8)}
              </span>
              <span className="flex items-center gap-1.5">
                <span>{new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="bg-[var(--accent-dim)] text-[var(--accent)] px-1 rounded font-bold">
                  {(h.score * 100).toFixed(0)}%
                </span>
              </span>
            </div>
            <div className="text-zinc-200 leading-relaxed break-words">{h.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

