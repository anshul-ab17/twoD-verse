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
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-colors duration-200 ${
        active
          ? "bg-[var(--accent-dim)] text-[var(--accent-bright)]"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-white"
      }`}>
      {icon}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
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
      className="relative h-[90px] w-[160px] overflow-hidden rounded-xl border border-zinc-700 bg-black transition-all duration-200">
      <span className="absolute bottom-1 left-2 z-10 text-[10px] font-medium text-white/80 [text-shadow:0_0_3px_#000]">
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
      className="grid h-dvh overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]"
      style={{
        gridTemplateColumns: `52px ${tab ? 320 : 0}px 1fr`,
        gridTemplateRows: "1fr 60px",
        transition: "grid-template-columns 250ms ease-out",
      }}
    >
      {/* rail */}
      <aside className="row-span-2 flex flex-col items-center gap-1 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] py-3">
        <span className="text-xl text-[var(--accent-bright)]">◈</span>
        <div className="my-2 h-px w-8 bg-[var(--border-subtle)]" />
        {TABS.map((t) => (
          <SidebarIcon key={t.id} icon={t.icon} label={t.label} badge={badge?.[t.id]}
            active={tab === t.id} onClick={() => onTab(tab === t.id ? null : t.id)} />
        ))}
        <div className="flex-1" />
        <SidebarIcon icon="⚙️" label="Settings" active={false} onClick={() => {}} />
      </aside>

      {/* slide panel — width driven by the grid column above */}
      <section className="row-span-2 overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="flex h-full w-[320px] flex-col">{panel}</div>
      </section>

      {/* canvas + overlays */}
      <main className="relative overflow-hidden">
        {children}
        {overlay}
      </main>

      {/* bottom bar */}
      <footer className="col-start-3 flex items-center justify-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4">
        {bottom}
      </footer>
    </div>
  )
}
