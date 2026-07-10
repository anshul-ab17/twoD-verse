"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthGuard } from "../../lib/use-auth-guard"
import {
  type Verse, listVerses, createVerse, renameVerse, deleteVerse, createInvite, acceptInvite,
} from "../../lib/verses"
import { SpaceCard } from "../_components/dashboard/space-card"
import { CreateSpaceModal } from "../_components/dashboard/create-space-modal"

export default function VerseDashboard() {
  const token = useAuthGuard()
  const router = useRouter()
  const [verses, setVerses] = useState<Verse[] | null>(null)
  const [query, setQuery] = useState("")
  const [note, setNote] = useState("")

  const load = useCallback(() => {
    listVerses().then(setVerses).catch(() => setVerses([]))
  }, [])

  useEffect(() => {
    if (token) load()
  }, [token, load])

  // accept ?invite= from a shared link
  useEffect(() => {
    const invite = new URLSearchParams(location.search).get("invite")
    if (token && invite) {
      acceptInvite(invite)
        .then(({ hash }) => router.replace(`/verse/${hash}`))
        .catch(() => router.replace("/verse"))
    }
  }, [token, router])

  if (!token) return null

  const shown = verses?.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()))

  const onCreate = async (name: string, template: string) => {
    const { hash } = await createVerse(name, template)
    router.push(`/verse/${hash}`)
  }

  const onRename = async (v: Verse) => {
    const name = prompt("New name", v.name)?.trim()
    if (name) {
      await renameVerse(v.id, name)
      load()
    }
  }

  const onDelete = async (v: Verse) => {
    if (confirm(`Delete "${v.name}"? This cannot be undone.`)) {
      await deleteVerse(v.id)
      load()
    }
  }

  const onInvite = async (v: Verse) => {
    const id = await createInvite(v.id)
    await navigator.clipboard.writeText(`${location.origin}/verse?invite=${id}`)
    setNote("Invite link copied")
    setTimeout(() => setNote(""), 2500)
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)]">
      <header className="flex h-14 items-center gap-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6">
        <span className="flex items-center gap-2 font-semibold">
          <span className="text-[var(--accent-bright)]">◈</span> Verse
        </span>
        <h1 className="text-sm text-[var(--text-secondary)]">My Spaces</h1>
        <div className="ml-auto flex items-center gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search spaces…"
            className="w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]" />
          <CreateSpaceModal onCreate={onCreate} />
        </div>
      </header>
      {note && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] px-4 py-2 text-sm">
          {note}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown?.map((v) => (
          <SpaceCard key={v.id} verse={v} onRename={onRename} onDelete={onDelete} onInvite={onInvite} />
        ))}
        {verses !== null && (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] transition-all duration-200 hover:border-violet-600/60">
            <CreateSpaceModal onCreate={onCreate} />
          </div>
        )}
      </div>
      {verses === null && <p className="px-6 text-sm text-[var(--text-muted)]">Loading…</p>}
    </main>
  )
}
