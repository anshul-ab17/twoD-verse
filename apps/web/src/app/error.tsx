"use client"

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <button
        onClick={reset}
        className="rounded-lg px-4 py-2 text-sm font-semibold"
        style={{ background: "var(--accent)", color: "#fff" }}
      >
        Try again
      </button>
    </div>
  )
}
