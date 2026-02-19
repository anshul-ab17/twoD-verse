"use client"

import { useRouter } from "next/navigation"

type Space = {
  id: string
  name: string
}

export default function DashboardView({
  spaces,
  deleteSpace,
}: {
  spaces: Space[]
  deleteSpace: (id: string) => Promise<void>
}) {
  const router = useRouter()

  return (
    <div className="px-20 pt-28">

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

        {spaces.map((space) => (
          <div
            key={space.id}
            className="group relative bg-neutral-900 p-6 rounded-2xl 
                       border border-white/10 
                       hover:border-indigo-500
                       transition"
          >
            <h2
              onClick={() => router.push(`/space/${space.id}`)}
              className="text-lg font-medium cursor-pointer"
            >
              {space.name}
            </h2>

            <form
              action={async () => {
                const confirmed = confirm(
                  "Are you sure you want to delete this space?"
                )
                if (!confirmed) return
                await deleteSpace(space.id)
              }}
            >
              <button
                type="submit"
                className="absolute top-4 right-4 opacity-0 
                           group-hover:opacity-100 
                           text-xs text-red-400 hover:text-red-300 transition"
              >
                Delete
              </button>
            </form>

          </div>
        ))}

      </div>

      {spaces.length === 0 && (
        <div className="text-white/60 mt-20 text-center">
          No spaces yet. Create one to get started.
        </div>
      )}

    </div>
  )
}
