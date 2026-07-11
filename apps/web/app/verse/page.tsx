"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  type Verse, listVerses, createVerse, renameVerse, deleteVerse, createInvite, acceptInvite, getCurrentUser,
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
  const [user, setUser] = useState<{ id: string; email: string; handle: string | null } | null>(null)

  const load = useCallback(() => {
    listVerses().then(setVerses).catch(() => setVerses([]))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => {})
  }, [])

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

  // Inject one dummy open test space for preview
  const safeShown = shown && shown.length > 0 
    ? shown 
    : [{ id: "dummy-test-space", name: "Sandbox Preview Space", hash: "office", template: "office", role: "MEMBER", memberCount: 8, onlineCount: 2 }]

  return (
    <main style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", color: "#181510" }}>

      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid rgba(24,21,16,0.12)", background: "#ffffff" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <span style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontStretch: "140%", fontSize: "19px", letterSpacing: "-0.02em", color: "#111111" }}>
            TwoD VERSE
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search verses…"
            style={{ background: "#efe9dd", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 999, padding: "7px 16px", fontSize: 13, outline: "none", width: 180, color: "#181510" }}
          />
          {user ? (
            <div style={{ position: "relative", width: 36, height: 36 }}>
              {/* Grey User Dummy PFP Icon */}
              <div 
                style={{ 
                  width: 36, 
                  height: 36, 
                  background: "#e4e4e7", 
                  border: "2.5px solid #27272a", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-[#27272a] fill-current">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              
              {/* Dynamic PFP image (overlay if loaded) */}
              <img 
                src={`https://unavatar.io/${user.email}`} 
                alt="" 
                style={{ 
                  position: "absolute",
                  inset: 0,
                  width: 36,
                  height: 36,
                  border: "2px solid #27272a",
                  borderRadius: "50%",
                  objectFit: "cover"
                }} 
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div 
              style={{ 
                width: 36, 
                height: 36, 
                background: "#e4e4e7", 
                border: "2.5px solid #27272a", 
                borderRadius: "50%", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}
            >
              <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-[#27272a] fill-current">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
      </header>

      {/* Title block */}
      <div style={{ padding: "44px 40px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, color: "rgba(24,21,16,0.55)", fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            {dayName} {timeOfDay} · {timeCtx}
          </div>
          <h1 style={{ margin: "8px 0 0", fontSize: 44, letterSpacing: "-0.02em", fontWeight: "normal", fontFamily: "Georgia, serif", color: "#111111" }}>
            Your verses
          </h1>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "28px 40px 0" }}>
        
        {/* Active/Dummy Space Cards */}
        {safeShown.map((v) => (
          <SpaceCard key={v.id} verse={v} onRename={onRename} onDelete={onDelete} onInvite={onInvite} />
        ))}

        {/* create placeholder - placed inside the grid layout */}
        {verses !== null && (
          <div
            style={{
              gridColumn: "span 1",
              border: "1.5px dashed rgba(24,21,16,0.3)", borderRadius: 14, minHeight: 280,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
              color: "rgba(24,21,16,0.5)", cursor: "pointer", background: "#fff"
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#111111"; (e.currentTarget as HTMLElement).style.color = "#111111" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(24,21,16,0.3)"; (e.currentTarget as HTMLElement).style.color = "rgba(24,21,16,0.5)" }}
          >
            <span style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontSize: "16px", letterSpacing: "-0.01em" }}>TwoD VERSE</span>
            <CreateSpaceModal onCreate={onCreate} />
            <div style={{ fontSize: 13 }}>Office · Campus · Hackathon · Conference</div>
          </div>
        )}
      </div>

      {/* happening now — full-width bottom footer */}
      <div style={{ padding: "32px 40px 48px" }}>
        <div style={{ background: "#181510", color: "#f4f1ea", borderRadius: 14, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <ProjectorIcon />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span 
                style={{ 
                  fontFamily: "'Anybody', sans-serif", 
                  fontWeight: 900, 
                  fontSize: "24px", 
                  letterSpacing: "-0.01em", 
                  color: "#ffffff",
                  textTransform: "uppercase"
                }}
              >
                "WORK IS THE SIDE QUEST"
              </span>
              <span 
                style={{ 
                  fontFamily: "Georgia, serif", 
                  fontSize: "15px", 
                  fontStyle: "italic",
                  color: "rgba(244,241,234,0.65)",
                  marginTop: 4
                }}
              >
                " Let's build your world. "
              </span>
              <div style={{ fontSize: 12, color: "rgba(244,241,234,0.4)", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 6, height: 6, background: "#ffffff", borderRadius: "50%" }} />
                Happening now: Friday demo day — main stage, acme-hq (14 teammates inside)
              </div>
            </div>
          </div>
          <button
            onClick={() => onCreate(`new-verse-${Math.floor(Math.random() * 1000)}`, "office")}
            style={{ background: "#ffffff", color: "#181510", fontSize: 14, fontWeight: 700, padding: "12px 28px", borderRadius: 999, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)", transition: "background 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e5e5")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            START
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
