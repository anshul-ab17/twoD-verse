"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type Verse, listVerses, createVerse, renameVerse, deleteVerse, createInvite, acceptInvite,
} from "../../lib/verses"
import { SpaceCard } from "../_components/dashboard/space-card"
import { CreateSpaceModal } from "../_components/dashboard/create-space-modal"

function DoorIcon() {
  return <img src="/assets/furniture/office/door.png" alt="" style={{ width: 20, imageRendering: "pixelated" }} />
}

function ProjectorIcon() {
  return <img src="/assets/furniture/office/projector.png" alt="" style={{ width: 70, imageRendering: "pixelated" }} />
}

export default function VerseDashboard() {
  const router = useRouter()
  const [verses, setVerses] = useState<Verse[] | null>(null)
  const [query, setQuery] = useState("")
  const [note, setNote] = useState("")
  const [filter, setFilter] = useState<"all" | "owned" | "joined">("all")

  const load = useCallback(() => {
    listVerses().then(setVerses).catch(() => setVerses([]))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const invite = new URLSearchParams(location.search).get("invite")
    if (invite) {
      acceptInvite(invite)
        .then(({ hash }) => router.replace(`/verse/${hash}`))
        .catch(() => router.replace("/verse"))
    }
  }, [router])

  const shown = verses?.filter((v) => {
    const matchesQuery = v.name.toLowerCase().includes(query.toLowerCase())
    const matchesFilter =
      filter === "all" ||
      (filter === "owned" && v.role === "OWNER") ||
      (filter === "joined" && v.role !== "OWNER")
    return matchesQuery && matchesFilter
  })

  const onCreate = async (name: string, template: string) => {
    const { hash } = await createVerse(name, template)
    router.push(`/verse/${hash}`)
  }

  const onRename = async (v: Verse) => {
    const name = prompt("New name", v.name)?.trim()
    if (name) { await renameVerse(v.id, name); load() }
  }

  const onDelete = async (v: Verse) => {
    if (confirm(`Delete "${v.name}"? This cannot be undone.`)) { await deleteVerse(v.id); load() }
  }

  const onInvite = async (v: Verse) => {
    const id = await createInvite(v.id)
    await navigator.clipboard.writeText(`${location.origin}/verse?invite=${id}`)
    setNote("Invite link copied")
    setTimeout(() => setNote(""), 2500)
  }

  const hour = new Date().getHours()
  const timeCtx = hour < 12 ? "morning light is on" : hour < 18 ? "the office lights are on" : "office lights are still on"
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()]
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"

  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", color: "#181510" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(24,21,16,0.12)", background: "#ffffff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 18 }}>
          <DoorIcon />verse
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verses…"
            style={{ background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 999, padding: "7px 16px", fontSize: 13, outline: "none", width: 180, color: "#181510" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", padding: "7px 14px", borderRadius: 999 }}>
            <span style={{ color: "#c66a2e", fontWeight: 600 }}>🔥 12-day streak</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", padding: "7px 14px", borderRadius: 999 }}>
            <span style={{ fontWeight: 600 }}>LVL 8</span>
            <span style={{ display: "inline-block", width: 80, height: 6, background: "rgba(24,21,16,0.12)", borderRadius: 3, overflow: "hidden" }}>
              <span style={{ display: "block", width: "62%", height: "100%", background: "#c66a2e" }} />
            </span>
            <span style={{ color: "rgba(24,21,16,0.55)" }}>620/1000 XP</span>
          </div>
          <div style={{ width: 34, height: 34, background: "#3e9b4f", border: "2px solid #181510", borderRadius: 8 }} />
        </div>
      </header>

      <div style={{ padding: "44px 40px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(24,21,16,0.55)" }}>{dayName} {timeOfDay} · {timeCtx}</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 48, letterSpacing: "-0.03em", fontWeight: 500, lineHeight: 1 }}>Your verses</h1>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {/* filter pills */}
          <div style={{ display: "flex", gap: 2, background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 999, padding: 3, fontSize: 13, fontWeight: 500 }}>
            {(["all", "owned", "joined"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? "#181510" : "transparent",
                  color: filter === f ? "#f4f1ea" : "rgba(24,21,16,0.6)",
                  padding: "7px 16px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                  fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <CreateSpaceModal onCreate={onCreate} />
        </div>
      </div>

      {/* grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "28px 40px 48px" }}>
        {shown?.map((v) => (
          <SpaceCard key={v.id} verse={v} onRename={onRename} onDelete={onDelete} onInvite={onInvite} />
        ))}

        {/* create placeholder */}
        {verses !== null && (
          <div
            style={{
              border: "1.5px dashed rgba(24,21,16,0.3)", borderRadius: 14, minHeight: 280,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
              color: "rgba(24,21,16,0.5)", cursor: "pointer", background: "#fff"
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#c66a2e"; (e.currentTarget as HTMLElement).style.color = "#c66a2e" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(24,21,16,0.3)"; (e.currentTarget as HTMLElement).style.color = "rgba(24,21,16,0.5)" }}
          >
            <DoorIcon />
            <CreateSpaceModal onCreate={onCreate} />
            <div style={{ fontSize: 13 }}>Office · Campus · Hackathon · Conference</div>
          </div>
        )}

        {/* happening now — spans 2 cols */}
        <div style={{ gridColumn: "span 2", background: "#181510", color: "#f4f1ea", borderRadius: 14, padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <ProjectorIcon />
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#c66a2e", fontWeight: 600 }}>Happening now</div>
              <div style={{ fontSize: 19, fontWeight: 600, marginTop: 4 }}>Friday demo day — main stage, acme-hq</div>
              <div style={{ fontSize: 13, color: "rgba(244,241,234,0.6)", marginTop: 2 }}>14 teammates already there · +50 XP for attending</div>
            </div>
          </div>
          <button
            onClick={() => onCreate("my-verse", "office")}
            style={{ background: "#c66a2e", color: "#fff", fontSize: 14, fontWeight: 500, padding: "11px 24px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)" }}
          >
            Teleport →
          </button>
        </div>
      </div>

      {verses === null && (
        <p style={{ padding: "0 40px", fontSize: 13, color: "rgba(24,21,16,0.5)" }}>Loading…</p>
      )}

      {note && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#181510", color: "#f4f1ea", padding: "10px 20px", borderRadius: 999, fontSize: 13, zIndex: 50 }}>
          {note}
        </div>
      )}
    </main>
  )
}
