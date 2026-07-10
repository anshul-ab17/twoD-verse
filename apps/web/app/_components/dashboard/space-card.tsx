"use client"

import Link from "next/link"
import type { Verse } from "../../../lib/verses"

/** Deterministic gradient per hash — placeholder until real map thumbnails. */
function hashGradient(hash: string): string {
  let a = 0
  for (const c of hash) a = (a * 31 + c.charCodeAt(0)) >>> 0
  const h1 = a % 360
  const h2 = (h1 + 60) % 360
  return `linear-gradient(135deg, hsl(${h1} 45% 22%), hsl(${h2} 45% 14%))`
}

export function SpaceCard({
  verse,
  onRename,
  onDelete,
  onInvite,
}: {
  verse: Verse
  onRename: (v: Verse) => void
  onDelete: (v: Verse) => void
  onInvite: (v: Verse) => void
}) {
  const admin = verse.role === "OWNER" || verse.role === "ADMIN"
  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-600/60 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)]">
      <Link href={`/verse/${verse.hash}`}>
        <div className="aspect-video w-full" style={{ background: hashGradient(verse.hash) }} />
      </Link>
      <div className="p-4">
        <h3 className="font-semibold text-[var(--text-primary)]">{verse.name}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {verse.memberCount} member{verse.memberCount === 1 ? "" : "s"}
          {verse.onlineCount > 0 && (
            <span> · <span className="text-[var(--online)]">●</span> {verse.onlineCount} online</span>
          )}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <Link href={`/verse/${verse.hash}`}
            className="rounded-lg border border-[var(--accent)]/50 px-4 py-1.5 text-sm text-[var(--accent-bright)] transition-colors duration-200 hover:bg-[var(--accent-dim)]">
            Enter →
          </Link>
          {/* ponytail: native <details> dropdown — no radix */}
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-white transition-colors duration-200">···</summary>
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1 text-sm shadow-xl">
              {admin && (
                <button onClick={() => onRename(verse)}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-surface)]">Rename</button>
              )}
              {admin && (
                <button onClick={() => onInvite(verse)}
                  className="block w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--bg-surface)]">Copy invite link</button>
              )}
              {verse.role === "OWNER" && (
                <button onClick={() => onDelete(verse)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[var(--danger)] hover:bg-[var(--bg-surface)]">Delete</button>
              )}
              {!admin && <div className="px-3 py-2 text-[var(--text-muted)]">Member</div>}
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
