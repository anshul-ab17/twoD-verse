"use client"

import Link from "next/link"
import type { Verse } from "../../../lib/verses"

const SPRITE_SETS = [
  {
    bg: "#e9e4d8",
    sprites: [
      { src: "/assets/furniture/office/desk.png", style: { left: 30, top: 66, width: 100 } },
      { src: "/assets/furniture/office/pc.png", style: { left: 52, top: 34, width: 50 } },
      { src: "/assets/furniture/office/whiteboard.png", style: { right: 110, top: 20, width: 80 } },
      { src: "/assets/furniture/office/plant.png", style: { right: 30, top: 76, width: 54 } },
      { src: "/assets/furniture/office/chair.png", style: { left: 160, top: 84, width: 44 } },
    ],
  },
  {
    bg: "#dde7ee",
    sprites: [
      { src: "/assets/furniture/office/meeting_table.png", style: { left: 36, top: 60, width: 120 } },
      { src: "/assets/furniture/office/laptop.png", style: { left: 64, top: 38, width: 48 } },
      { src: "/assets/furniture/office/laptop.png", style: { left: 190, top: 70, width: 48 } },
      { src: "/assets/furniture/office/water_cooler.png", style: { right: 36, top: 50, width: 46 } },
      { src: "/assets/furniture/office/wall_clock.png", style: { right: 110, top: 20, width: 36 } },
    ],
  },
  {
    bg: "#e6e9df",
    sprites: [
      { src: "/assets/furniture/office/sofa.png", style: { left: 34, top: 64, width: 100 } },
      { src: "/assets/furniture/office/koi_pond.png", style: { right: 34, top: 56, width: 120 } },
      { src: "/assets/furniture/office/floor_lamp.png", style: { left: 150, top: 44, width: 40 } },
      { src: "/assets/furniture/office/pet_bed.png", style: { left: 200, top: 104, width: 66 } },
    ],
  },
  {
    bg: "#e8ecef",
    sprites: [
      { src: "/assets/furniture/office/bookshelf.png", style: { right: 48, top: 24, width: 82 } },
      { src: "/assets/furniture/office/desk.png", style: { left: 60, top: 80, width: 150 } },
      { src: "/assets/furniture/office/pc.png", style: { left: 96, top: 50, width: 70 } },
      { src: "/assets/furniture/office/bonsai_a.png", style: { left: 52, top: 100, width: 72 } },
    ],
  },
]

function SpriteScene({ hash }: { hash: string }) {
  let seed = 0
  for (const c of hash) seed = (seed * 31 + c.charCodeAt(0)) >>> 0
  const set = SPRITE_SETS[seed % SPRITE_SETS.length]!

  return (
    <div
      style={{
        position: "relative", height: "100%",
        background: set.bg,
        backgroundImage: "linear-gradient(rgba(24,21,16,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(24,21,16,0.05) 1px,transparent 1px)",
        backgroundSize: "24px 24px",
        overflow: "hidden",
      }}
    >
      {set.sprites.map((sp, i) => (
        <img
          key={i}
          src={sp.src}
          alt=""
          style={{ position: "absolute", imageRendering: "pixelated", ...sp.style } as React.CSSProperties}
        />
      ))}
    </div>
  )
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
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(24,21,16,0.14)",
        borderRadius: 14,
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
        color: "#181510",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "0 6px 20px rgba(24,21,16,0.12)"
        el.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = "none"
        el.style.transform = "none"
      }}
    >
      <Link href={`/verse/${verse.hash}`} style={{ display: "block" }}>
        <div style={{ position: "relative", height: 150 }}>
          <SpriteScene hash={verse.hash} />
          <div style={{ position: "absolute", left: 14, bottom: 12, display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, background: verse.onlineCount > 0 ? "#3e9b4f" : "rgba(24,21,16,0.3)", borderRadius: "50%", display: "inline-block" }} />
            {verse.onlineCount > 0 ? `${verse.onlineCount} inside` : "quiet now"}
          </div>
        </div>
      </Link>
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{verse.name}</div>
          <div style={{ fontSize: 12, color: "rgba(24,21,16,0.5)", textTransform: "capitalize" }}>
            {verse.template ? verse.template.charAt(0).toUpperCase() + verse.template.slice(1) : "Office"}
          </div>
        </div>
        <div style={{ fontSize: 13, color: "rgba(24,21,16,0.55)", marginTop: 4 }}>
          {verse.onlineCount > 0 ? `Active collaboration session in progress` : `No active meetings right now`}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ width: 26, height: 26, background: "#c66a2e", border: "2px solid #fff", borderRadius: 8 }} />
            <span style={{ width: 26, height: 26, background: "#3e9b4f", border: "2px solid #fff", borderRadius: 8, marginLeft: -8 }} />
            <span style={{ width: 26, height: 26, background: "#2f6db8", border: "2px solid #fff", borderRadius: 8, marginLeft: -8 }} />
            <span style={{ width: 26, height: 26, background: "#efe9dd", border: "2px solid #fff", borderRadius: 8, marginLeft: -8, fontSize: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#181510", fontWeight: 600 }}>+{verse.memberCount}</span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <Link
              href={`/verse/${verse.hash}`}
              style={{ background: "#181510", color: "#f4f1ea", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 999, textDecoration: "none" }}
            >
              Enter →
            </Link>
            {/* ponytail: native <details> dropdown */}
            <details style={{ position: "relative" }}>
              <summary style={{ cursor: "pointer", listStyle: "none", padding: "6px 8px", borderRadius: 8, color: "rgba(24,21,16,0.5)", fontSize: 18 }}>···</summary>
              <div style={{ position: "absolute", right: 0, zIndex: 20, marginTop: 4, width: 176, background: "#fff", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 12, padding: 4, boxShadow: "0 4px 16px rgba(24,21,16,0.10)" }}>
                {admin && (
                  <button onClick={() => onRename(verse)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#181510" }}>Rename</button>
                )}
                {admin && (
                  <button onClick={() => onInvite(verse)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#181510" }}>Copy invite link</button>
                )}
                {verse.role === "OWNER" && (
                  <button onClick={() => onDelete(verse)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#fd8a65" }}>Delete</button>
                )}
                {!admin && <div style={{ padding: "10px 12px", fontSize: 13, color: "rgba(24,21,16,0.4)" }}>Member</div>}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
