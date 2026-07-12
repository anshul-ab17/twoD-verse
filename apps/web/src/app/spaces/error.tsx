"use client"

export default function SpacesError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "#ffffff", color: "#181510" }}>
      <h2 className="text-xl font-bold">Failed to load spaces</h2>
      <button onClick={reset} className="rounded-full px-6 py-2 text-sm font-bold" style={{ background: "#181510", color: "#fff" }}>
        Retry
      </button>
    </div>
  )
}
