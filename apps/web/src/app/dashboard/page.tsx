"use client"

import Hero from "@/components/home/Hero"
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
}

function syncSpacesToLocalStorage(spaces: SpaceSummary[], userId: string, userName: string) {
  if (typeof window === "undefined") return

  const mapped = spaces.map((space) => ({
    id: space.id,
    name: space.name,
    creatorId: space.creatorId,
    creatorName: userName,
    members: [
      {
        id: userId,
        name: userName,
      },
    ],
    width: space.width,
    height: space.height,
  }))

  localStorage.setItem("spaces", JSON.stringify(mapped))
}

export default function Dashboard() {
  const router = useRouter()
  const { user, status } = useAuthSession()
  const [spaces, setSpaces] = useState<SpaceSummary[]>([])
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load spaces"
      setError(message)
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
      await apiFetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      })
      setSpaces((prev) => {
        const next = prev.filter((space) => space.id !== spaceId)
        if (user) {
          syncSpacesToLocalStorage(next, user.id, user.name)
        }
        return next
      })
      setDeleteTarget(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete space"
      setError(message)
    }
  }

  if (status !== "authenticated" || !user) {
    return null
  }

  return (
    <Hero overlay="bg-black/20" blur="backdrop-blur-md">
      <div className="w-full max-w-6xl text-white px-6 relative">
        <div className="flex justify-between items-center mb-12 gap-4">
          <div className="bg-[#8B5A2B] px-8 py-4 rounded-xl border border-[#5A3B1C] shadow-xl">
            <h1 className="text-2xl font-bold text-yellow-200">
              Your Spaces
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard/spaces/create")}
              className="px-6 py-3 bg-[#556B2F] hover:bg-[#6B8E23] rounded-xl shadow-lg transition"
            >
              + Create Space
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loadingSpaces ? (
          <p className="text-white/70">Loading spaces...</p>
        ) : spaces.length === 0 ? (
          <p className="text-white/70">
            No created spaces yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {spaces.map((space) => (
              <div
                key={space.id}
                onClick={() => router.push(`/dashboard/spaces/${space.id}`)}
                className="bg-[#8B5A2B] p-8 rounded-2xl border border-[#5A3B1C] shadow-xl relative cursor-pointer hover:scale-105 transition"
              >
                <h2 className="text-xl font-semibold text-yellow-200 mb-2">
                  {space.name}
                </h2>

                <p className="text-sm text-white/80 mb-2">
                  Map size: {space.width} x {space.height}
                </p>

                <p className="text-yellow-300 text-sm mb-4">
                  Me (Admin)
                </p>

                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setDeleteTarget(space)
                  }}
                  className="text-red-300 text-sm hover:text-red-500 transition"
                >
                  Delete Space
                </button>
              </div>
            ))}
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#8B5A2B] p-8 rounded-2xl border border-[#5A3B1C] shadow-2xl w-100">
              <h2 className="text-xl font-bold text-yellow-200 mb-4">
                Delete Space?
              </h2>

              <p className="text-white/80 mb-6">
                Are you sure you want to delete{" "}
                <span className="text-yellow-300">
                  {deleteTarget.name}
                </span>
                ? This cannot be undone.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  onClick={() => deleteSpace(deleteTarget.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Hero>
  )
}
