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

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")
    setSpaces(stored)
  }, [])

  const handleDelete = (id: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this space?"
    )

    if (!confirmed) return

    const updated = spaces.filter((space) => space.id !== id)

    localStorage.setItem(
      "twodverse-spaces",
      JSON.stringify(updated)
    )

    setSpaces(updated)
  }

  return (
    <div className="px-20 pt-28">

      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your Spaces
        </h1>

        <button
          onClick={() => router.push("/space/create")}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium hover:bg-indigo-500 transition"
        >
          + Create New Space
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        {spaces.map((space) => (
          <div
            key={space.id}
            className="group relative bg-neutral-900 p-6 rounded-2xl 
                       border border-white/10 
                       transition-all duration-300
                       hover:border-indigo-500
                       hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]
                       hover:-translate-y-1"
          >
            {/* Space Name */}
            <h2
              onClick={() => router.push(`/space/${space.id}`)}
              className="text-lg font-medium cursor-pointer"
            >
              {space.name}
            </h2>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(space.id)}
              className="absolute top-4 right-4 opacity-0 
                         group-hover:opacity-100 
                         text-xs text-red-400 hover:text-red-300 transition"
            >
              Delete
            </button>

          </div>
        ))}

      </div>

      {/* Empty State */}
      {spaces.length === 0 && (
        <div className="text-white/60 mt-20 text-center">
          No spaces yet. Create one to get started.
        </div>
      )}

    </div>
  )
}
