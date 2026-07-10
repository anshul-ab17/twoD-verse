"use client"

// Presentational shell for /verse/[hash] (spec §5). CSS Grid: 52px rail ·
// animated 0↔320px panel · canvas; 60px bottom bar spans all columns.
// No game state here — parent wires bridge events in.

import { useEffect, useRef } from "react"

export type PanelTab = "people" | "chat" | "calendar" | "notifications"
export type ChatMsg = { from: string; text: string; ts: number }

export function SidebarIcon({
  icon, label, active, badge, onClick,
}: {
  icon: string
  label: string
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg text-lg transition-all duration-200 ${
        active
          ? "bg-white/5 border border-[var(--accent)] text-[var(--accent-bright)] shadow-[0_0_12px_rgba(198,254,30,0.2)]"
          : "text-[var(--text-secondary)] border border-transparent hover:bg-white/5 hover:text-white"
      }`}>
      {/* vertical neon left bar indicator when active */}
      {active && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[var(--accent)]" />
      )}
      <span>{icon}</span>
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-black border border-black animate-pulse">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  )
}

/** One remote (or local) camera feed; media layer owns the <video> element. */
export function VideoTile({ identity, el }: { identity: string; el: HTMLVideoElement }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    el.style.width = "100%"
    el.style.height = "100%"
    el.style.objectFit = "cover"
    node.appendChild(el)
    return () => el.remove()
  }, [el])
  return (
    <div ref={ref}
      className="relative h-[95px] w-[170px] overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-lg transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[0_0_15px_rgba(198,254,30,0.15)]">
      <span className="absolute bottom-1.5 left-2 z-10 rounded bg-black/60 border border-white/5 px-1.5 py-0.5 text-[9px] font-mono text-white/90">
        {identity}
      </span>
    </div>
  )
}

const TABS: { id: PanelTab; icon: string; label: string }[] = [
  { id: "people", icon: "👥", label: "People" },
  { id: "chat", icon: "💬", label: "Chat" },
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
]

export function GameShell({
  children, tab, onTab, panel, bottom, overlay, badge,
}: {
  children: React.ReactNode
  tab: PanelTab | null
  onTab: (t: PanelTab | null) => void
  panel: React.ReactNode
  bottom: React.ReactNode
  overlay?: React.ReactNode
  badge?: Partial<Record<PanelTab, number>>
}) {
  return (
    <div
      className="grid h-dvh overflow-hidden bg-[#060608] text-[var(--text-primary)]"
      style={{
        gridTemplateColumns: `56px ${tab ? 320 : 0}px 1fr`,
        gridTemplateRows: "1fr 64px",
        transition: "grid-template-columns 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* rail */}
      <aside className="row-span-2 flex flex-col items-center gap-2 border-r border-white/5 bg-[#0e0e12] py-4">
        <span className="text-xl text-[var(--accent-bright)] select-none">◈</span>
        <div className="my-2 h-px w-8 bg-white/5" />
        {TABS.map((t) => (
          <SidebarIcon key={t.id} icon={t.icon} label={t.label} badge={badge?.[t.id]}
            active={tab === t.id} onClick={() => onTab(tab === t.id ? null : t.id)} />
        ))}
        <div className="flex-1" />
        <SidebarIcon icon="⚙️" label="Settings" active={false} onClick={() => {}} />
      </aside>

      {/* slide panel — width driven by the grid column above */}
      <section className="row-span-2 overflow-hidden border-r border-white/5 bg-[#0e0e12] glass-panel">
        <div className="flex h-full w-[320px] flex-col">{panel}</div>
      </section>

      {/* canvas + overlays */}
      <main className="relative overflow-hidden bg-black">
        {children}
        {overlay}
      </main>

      {/* bottom bar */}
      <footer className="col-start-3 flex items-center justify-center gap-4 border-t border-white/5 bg-[#0e0e12]/90 backdrop-blur-md px-6">
        {bottom}
      </footer>
    </div>
  )
}

