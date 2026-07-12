"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { type Space, listSpaces, createSpace, renameSpace, deleteSpace } from "@/lib/api/spaces"
import { SpaceCard } from "@/features/spaces/space-card"
import { CreateSpaceModal } from "@/features/spaces/create-space-modal"
import RequireSession from "@/features/auth/RequireSession"
import { useAuthSession } from "@/features/auth/AuthSessionProvider"

function ProjectorIcon() {
  return <img src="/ui/furniture/office/projector.png" alt="" style={{ width: 70, imageRendering: "pixelated" }} />
}

function Dashboard() {
  const router = useRouter()
  const { user } = useAuthSession()
  const [spaces, setSpaces] = useState<Space[] | null>(null)
  const [query, setQuery] = useState("")
  const [note, setNote] = useState("")

  const load = useCallback(() => {
    listSpaces().then(setSpaces).catch(() => setSpaces([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const shown = spaces?.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))

  const onCreate = async (name: string) => {
    const space = await createSpace(name)
    router.push(`/spaces/${space.id}`)
  }

  const onRename = async (s: Space) => {
    const name = prompt("New name", s.name)?.trim()
    if (name) {
      await renameSpace(s.id, name)
      load()
    }
  }

  const onDelete = async (s: Space) => {
    if (confirm(`Delete "${s.name}"? This cannot be undone.`)) {
      await deleteSpace(s.id)
      load()
    }
  }

  const onInvite = async (s: Space) => {
    await navigator.clipboard.writeText(`${typeof location !== "undefined" ? location.origin : ""}/spaces/${s.id}`)
    setNote("Invite link copied")
    setTimeout(() => setNote(""), 2500)
  }

  const hour = new Date().getHours()
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"
  const timeCtx = hour < 12 ? "morning light is on" : hour < 18 ? "the office lights are on" : "office lights are still on"

  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "var(--font-geist-sans, system-ui, sans-serif)", color: "#181510" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(24,21,16,0.12)", background: "#ffffff" }}>
        <Link href="/" style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 900, fontSize: "19px", letterSpacing: "-0.02em", color: "#111111", textDecoration: "none" }}>
          TwoD VERSE
        </Link>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search spaces…"
          style={{ background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 999, padding: "7px 16px", fontSize: 13, outline: "none", width: 180, color: "#181510" }}
        />
      </header>

      <div style={{ padding: "44px 40px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(24,21,16,0.55)", fontStyle: "italic" }}>
            {dayName} {timeOfDay} · {timeCtx}
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 44, letterSpacing: "-0.02em", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#111111" }}>
            Your spaces
          </h1>
        </div>
        <CreateSpaceModal onCreate={onCreate} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "28px 40px 0" }}>
        {shown?.map((s) => (
          <SpaceCard
            key={s.id}
            space={s}
            onRename={onRename}
            onDelete={onDelete}
            onInvite={onInvite}
            onClick={(sp) => router.push(`/spaces/${sp.id}`)}
          />
        ))}
        {spaces !== null && (
          <div
            style={{ border: "1.5px dashed rgba(24,21,16,0.3)", borderRadius: 14, minHeight: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(24,21,16,0.5)", cursor: "pointer", background: "#fff" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#111111"
              ;(e.currentTarget as HTMLElement).style.color = "#111111"
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(24,21,16,0.3)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(24,21,16,0.5)"
            }}
          >
            <CreateSpaceModal onCreate={onCreate} />
          </div>
        )}
      </div>

      <div style={{ padding: "32px 40px 48px" }}>
        <div style={{ background: "#181510", color: "#f4f1ea", borderRadius: 14, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ProjectorIcon />
            <div>
              <span style={{ fontWeight: 900, fontSize: "24px", letterSpacing: "-0.01em", color: "#ffffff", textTransform: "uppercase", display: "block" }}>
                "WORK IS THE SIDE QUEST"
              </span>
              <span style={{ fontFamily: "Georgia, serif", fontSize: "15px", fontStyle: "italic", color: "rgba(244,241,234,0.65)", display: "block", marginTop: 4 }}>
                Let's build your world.
              </span>
            </div>
          </div>
          <button
            onClick={() => void onCreate(`space-${Date.now()}`)}
            style={{ background: "#ffffff", color: "#181510", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            START
          </button>
        </div>
      </div>

      {spaces === null && <p style={{ padding: "0 40px", fontSize: 13, color: "rgba(24,21,16,0.5)" }}>Loading…</p>}

      {note && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#181510", color: "#f4f1ea", padding: "10px 20px", borderRadius: 999, fontSize: 13, zIndex: 50 }}>
          {note}
        </div>
      )}
    </main>
  )
}

export default function SpacesPage() {
  return (
    <RequireSession>
      <Dashboard />
    </RequireSession>
  )
}
