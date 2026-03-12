"use client"

import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useState } from "react"

type CreatedSpace = {
  id: string
  name: string
  creatorId: string
  width: number
  height: number
}

export default function CreateSpacePage() {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [creating, setCreating] = useState(false)
  const { user } = useAuthSession()
  const router = useRouter()

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    setError("")

    try {
      const space = await apiFetch<CreatedSpace>("/api/spaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), width: 1600, height: 800 }),
      })

      if (typeof window !== "undefined" && user) {
        const spaces = JSON.parse(localStorage.getItem("spaces") || "[]")
        const existing = spaces.find((entry: { id?: string }) => entry?.id === space.id)
        if (!existing) {
          spaces.push({
            id: space.id,
            name: space.name,
            creatorId: space.creatorId,
            creatorName: user.name,
            members: [{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }],
            width: space.width,
            height: space.height,
          })
          localStorage.setItem("spaces", JSON.stringify(spaces))
        }
      }

      router.push(`/dashboard/spaces/${space.id}/invite`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create space")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%" }}>
        {/* Back link */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to Dashboard
        </button>

        <div
          className="rounded-2xl border p-8 shadow-2xl"
          style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
              Create a Space
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Set up your virtual 2D office in seconds.
            </p>
          </div>

          {/* Name input */}
          <div className="mb-4">
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Space Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
              placeholder="e.g. Team HQ, Design Lab…"
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
              style={{
                background: "var(--bg)",
                borderColor: "var(--card-border)",
                color: "var(--text)",
              }}
              autoFocus
            />
          </div>

          {/* Info pills */}
          <div className="mb-6 flex flex-wrap gap-2">
            {["1600 × 800 map", "Pixel-art world", "Real-time multiplayer"].map((label) => (
              <span
                key={label}
                className="rounded-full border px-3 py-1 text-xs"
                style={{ borderColor: "var(--card-border)", color: "var(--text-muted)", background: "var(--bg)" }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: "#f87171", background: "#3f0a0a", color: "#fca5a5" }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={() => void handleCreate()}
            disabled={creating || !name.trim()}
            className="w-full rounded-xl py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {creating ? "Creating…" : "Create Space →"}
          </button>
        </div>
      </div>
    </div>
  )
}
