"use client"

import { type Space } from "@/lib/api/spaces"

const SPRITE_SETS = [
  {
    bg: "#e9e4d8",
    sprites: [
      { src: "/ui/furniture/office/desk.png", style: { left: 30, top: 66, width: 100 } },
      { src: "/ui/furniture/office/pc.png", style: { left: 52, top: 34, width: 50 } },
      { src: "/ui/furniture/office/whiteboard.png", style: { right: 110, top: 20, width: 80 } },
      { src: "/ui/furniture/office/plant.png", style: { right: 30, top: 76, width: 54 } },
      { src: "/ui/furniture/office/chair.png", style: { left: 160, top: 84, width: 44 } },
    ],
  },
  {
    bg: "#dde7ee",
    sprites: [
      { src: "/ui/furniture/office/meeting_table.png", style: { left: 36, top: 60, width: 120 } },
      { src: "/ui/furniture/office/laptop.png", style: { left: 64, top: 38, width: 48 } },
      { src: "/ui/furniture/office/laptop.png", style: { left: 190, top: 70, width: 48 } },
      { src: "/ui/furniture/office/water_cooler.png", style: { right: 36, top: 50, width: 46 } },
      { src: "/ui/furniture/office/wall_clock.png", style: { right: 110, top: 20, width: 36 } },
    ],
  },
  {
    bg: "#e6e9df",
    sprites: [
      { src: "/ui/furniture/office/sofa.png", style: { left: 34, top: 64, width: 100 } },
      { src: "/ui/furniture/office/koi_pond.png", style: { right: 34, top: 56, width: 120 } },
      { src: "/ui/furniture/office/floor_lamp.png", style: { left: 150, top: 44, width: 40 } },
      { src: "/ui/furniture/office/pet_bed.png", style: { left: 200, top: 104, width: 66 } },
    ],
  },
  {
    bg: "#e8ecef",
    sprites: [
      { src: "/ui/furniture/office/bookshelf.png", style: { right: 48, top: 24, width: 82 } },
      { src: "/ui/furniture/office/desk.png", style: { left: 60, top: 80, width: 150 } },
      { src: "/ui/furniture/office/pc.png", style: { left: 96, top: 50, width: 70 } },
      { src: "/ui/furniture/office/bonsai_a.png", style: { left: 52, top: 100, width: 72 } },
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
        position: "relative",
        height: "100%",
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
  space,
  onRename,
  onDelete,
  onInvite,
  onClick,
}: {
  space: Space
  onRename: (s: Space) => void
  onDelete: (s: Space) => void
  onInvite: (s: Space) => void
  onClick: (s: Space) => void
}) {
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
      <div onClick={() => onClick(space)} style={{ cursor: "pointer", display: "block" }}>
        <div style={{ position: "relative", height: 150 }}>
          <SpriteScene hash={space.id} />
        </div>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 19, fontWeight: 600 }}>{space.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <div />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={() => onClick(space)}
              style={{ background: "#181510", color: "#f4f1ea", fontSize: 13, fontWeight: 500, padding: "8px 18px", borderRadius: 999, textDecoration: "none", border: "none", cursor: "pointer" }}
            >
              Enter →
            </button>
            <details style={{ position: "relative" }}>
              <summary style={{ cursor: "pointer", listStyle: "none", padding: "6px 8px", borderRadius: 8, color: "rgba(24,21,16,0.5)", fontSize: 18 }}>···</summary>
              <div style={{ position: "absolute", right: 0, zIndex: 20, marginTop: 4, width: 176, background: "#fff", border: "1px solid rgba(24,21,16,0.14)", borderRadius: 12, padding: 4, boxShadow: "0 4px 16px rgba(24,21,16,0.10)" }}>
                <button onClick={() => onRename(space)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#181510" }}>Rename</button>
                <button onClick={() => onInvite(space)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#181510" }}>Copy invite link</button>
                <button onClick={() => onDelete(space)} style={{ display: "block", width: "100%", padding: "10px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: 13, borderRadius: 8, color: "#fd8a65" }}>Delete</button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
