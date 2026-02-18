"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Space = {
  id: string
  name: string
}

export default function DashboardView() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const router = useRouter()

  // Load spaces from localStorage
  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")

    setSpaces(stored)
  }, [])

  // Delete space
  const handleDelete = (id: string) => {
    const updated = spaces.filter((space) => space.id !== id)

    localStorage.setItem(
      "twodverse-spaces",
      JSON.stringify(updated)
    )

    setSpaces(updated)
  }

  return (
    <div className="px-16 pt-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold">
          Your Spaces
        </h1>

        <button
          onClick={() => router.push("/space/create")}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium hover:bg-indigo-500 transition"
        >
          + Create New Space
        </button>
      </div>

      {/* Spaces Grid */}
      <div className="grid gap-4">

        {spaces.map((space) => (
          <div
            key={space.id}
            className="flex items-center justify-between p-4 bg-neutral-800 rounded hover:bg-neutral-700 transition"
          >
            {/* Clickable Space Name */}
            <span
              onClick={() => router.push(`/space/${space.id}`)}
              className="cursor-pointer"
            >
              {space.name}
            </span>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(space.id)
              }}
              className="px-3 py-1 bg-red-600 rounded text-xs hover:bg-red-500 transition"
            >
              Delete
            </button>
          </div>
        ))}

      </div>

      {/* Empty State */}
      {spaces.length === 0 && (
        <div className="text-white/60 mt-10">
          No spaces yet. Create one to get started.
        </div>
      )}

    </div>
  )
}
