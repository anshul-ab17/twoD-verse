"use client"

import { useRef, useState } from "react"

const TEMPLATES = [
  { id: "office", icon: "🏢", label: "Office" },
  { id: "campus", icon: "🎓", label: "Campus" },
  { id: "hackathon", icon: "⚡", label: "Hackathon" },
  { id: "lounge", icon: "🛋", label: "Lounge" },
]

export function CreateSpaceModal({ onCreate }: { onCreate: (name: string, template: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState("")
  const [template, setTemplate] = useState("office")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    setError("")
    try {
      await onCreate(name.trim(), template)
      ref.current?.close()
      setName("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button onClick={() => ref.current?.showModal()}
        className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--accent-bright)]">
        + New Space
      </button>
      <dialog ref={ref}
        className="m-auto w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] p-0 text-[var(--text-primary)] backdrop:bg-black/60 backdrop:backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Create a space</h2>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Space name…"
            className="mt-4 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setTemplate(t.id)}
                className={`rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                  template === t.id
                    ? "border-[var(--accent)] bg-[var(--accent-dim)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-default)]"
                }`}>
                <span className="mr-2">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => ref.current?.close()}
              className="rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors duration-200 hover:text-white">
              Cancel
            </button>
            <button disabled={busy || !name.trim()} onClick={submit}
              className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--accent-bright)] disabled:opacity-50">
              {busy ? "…" : "Create Space →"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
