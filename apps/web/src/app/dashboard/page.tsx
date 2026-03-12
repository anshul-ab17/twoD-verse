"use client"

import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

type SpaceSummary = {
  id: string
  name: string
  width: number
  height: number
  creatorId: string
  creatorName?: string
  isVisited?: boolean
}

function syncSpacesToLocalStorage(spaces: SpaceSummary[], userId: string, userName: string) {
  if (typeof window === "undefined") return
  const mapped = spaces.map((space) => ({
    id: space.id,
    name: space.name,
    creatorId: space.creatorId,
    creatorName: userName,
    members: [{ id: userId, name: userName }],
    width: space.width,
    height: space.height,
  }))
  localStorage.setItem("spaces", JSON.stringify(mapped))
}

function loadVisitedSpaces(ownedIds: Set<string>): SpaceSummary[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("twodverse:visited-spaces")
    if (!raw) return []
    const visited = JSON.parse(raw) as SpaceSummary[]
    return visited
      .filter((s) => s?.id && !ownedIds.has(s.id))
      .map((s) => ({ ...s, isVisited: true }))
  } catch {
    return []
  }
}

function SpaceCard({
  space,
  onClick,
  onDelete,
}: {
  space: SpaceSummary
  onClick: () => void
  onDelete?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="card-hover rounded-2xl border p-6 cursor-pointer"
      style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
    >
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
          {space.name}
        </h2>
        {space.isVisited && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-border)" }}
          >
            Invited
          </span>
        )}
      </div>
      <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
        Map: {space.width} × {space.height}
      </p>
      <p className="text-sm mb-4" style={{ color: "var(--accent)" }}>
        {space.isVisited ? `by ${space.creatorName ?? "Unknown"}` : "Me (Admin)"}
      </p>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-xs transition-colors hover:opacity-80"
          style={{ color: "#f87171" }}
        >
          Delete Space
        </button>
      )}
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, status } = useAuthSession()
  const [spaces, setSpaces] = useState<SpaceSummary[]>([])
  const [visitedSpaces, setVisitedSpaces] = useState<SpaceSummary[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(true)
  const [error, setError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<SpaceSummary | null>(null)

  const loadSpaces = useCallback(async () => {
    if (!user) return
    setLoadingSpaces(true)
    setError("")
    try {
      const response = await apiFetch<SpaceSummary[]>("/api/spaces")
      setSpaces(response)
      syncSpacesToLocalStorage(response, user.id, user.name)
      const ownedIds = new Set(response.map((s) => s.id))
      setVisitedSpaces(loadVisitedSpaces(ownedIds))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load spaces")
    } finally {
      setLoadingSpaces(false)
    }
  }, [user])

  useEffect(() => {
    if (status !== "authenticated" || !user) return
    void loadSpaces()
  }, [loadSpaces, status, user])

  const deleteSpace = async (spaceId: string) => {
    try {
      await apiFetch(`/api/spaces/${spaceId}`, { method: "DELETE" })
      setSpaces((prev) => {
        const next = prev.filter((s) => s.id !== spaceId)
        if (user) syncSpacesToLocalStorage(next, user.id, user.name)
        return next
      })
      setDeleteTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete space")
    }
  }

  const removeVisited = (spaceId: string) => {
    const next = visitedSpaces.filter((s) => s.id !== spaceId)
    setVisitedSpaces(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("twodverse:visited-spaces", JSON.stringify(next))
    }
  }

  if (status !== "authenticated" || !user) return null

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 1152, margin: "0 auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div
            className="rounded-xl border px-6 py-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
          >
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              Your Spaces
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard/spaces/create")}
            className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            + Create Space
          </button>
        </div>

        {error && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: "#f87171", background: "#3f0a0a", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        {loadingSpaces ? (
          <p style={{ color: "var(--text-muted)" }}>Loading spaces...</p>
        ) : (
          <>
            {/* Owned spaces */}
            {spaces.length === 0 ? (
              <p className="mb-8" style={{ color: "var(--text-muted)" }}>No created spaces yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {spaces.map((space) => (
                  <SpaceCard
                    key={space.id}
                    space={space}
                    onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                    onDelete={() => setDeleteTarget(space)}
                  />
                ))}
              </div>
            )}

            {/* Visited / invited spaces */}
            {visitedSpaces.length > 0 && (
              <>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Spaces you were invited to
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visitedSpaces.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                      onDelete={() => removeVisited(space.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Delete modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div
              className="rounded-2xl border p-8 w-full max-w-sm shadow-2xl"
              style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
            >
              <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>
                {deleteTarget.isVisited ? "Remove Space?" : "Delete Space?"}
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                {deleteTarget.isVisited
                  ? <>Remove <span style={{ color: "var(--accent)" }}>{deleteTarget.name}</span> from your dashboard?</>
                  : <>Are you sure you want to delete <span style={{ color: "var(--accent)" }}>{deleteTarget.name}</span>? This cannot be undone.</>
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg px-4 py-2 text-sm"
                  style={{ background: "var(--bg)", border: "1px solid var(--card-border)", color: "var(--text-muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteTarget.isVisited) { removeVisited(deleteTarget.id); setDeleteTarget(null) }
                    else void deleteSpace(deleteTarget.id)
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: "#dc2626", color: "#fff" }}
                >
                  {deleteTarget.isVisited ? "Remove" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
