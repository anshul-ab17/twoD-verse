"use client"

import Hero from "@/components/home/Hero"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [spaces, setSpaces] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("currentUser")!
    )
    setCurrentUser(user)

    const allSpaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const mySpaces = allSpaces.filter((space: any) =>
      space.members.some((m: any) => m.id === user.id)
    )

    setSpaces(mySpaces)
  }, [])

  if (!currentUser) return null

  const deleteSpace = (spaceId: string) => {
    const allSpaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const updated = allSpaces.filter(
      (space: any) => space.id !== spaceId
    )

    localStorage.setItem(
      "spaces",
      JSON.stringify(updated)
    )

    setSpaces((prev) =>
      prev.filter((s) => s.id !== spaceId)
    )

    setDeleteTarget(null)
  }

  return (
    <Hero overlay="bg-black/20" blur="backdrop-blur-md">
      <div className="w-full max-w-6xl text-white px-6 relative">

        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div className="bg-[#8B5A2B] px-8 py-4 rounded-xl border border-[#5A3B1C] shadow-xl">
            <h1 className="text-2xl font-bold text-yellow-200">
              Your Spaces
            </h1>
          </div>

          <button
            onClick={() =>
              router.push("/dashboard/spaces/create")
            }
            className="px-6 py-3 bg-[#556B2F]
                       hover:bg-[#6B8E23]
                       rounded-xl shadow-lg transition"
          >
            + Create Space
          </button>
        </div>

        {/* Space Grid */}
        {spaces.length === 0 ? (
          <p className="text-white/70">
            No joined spaces yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {spaces.map((space) => {
              const isCreator =
                space.creatorId === currentUser.id

              return (
                <div
                  key={space.id}
                  onClick={() =>
                    router.push(
                      `/dashboard/spaces/${space.id}`
                    )
                  }
                  className="bg-[#8B5A2B] p-8 rounded-2xl
                             border border-[#5A3B1C]
                             shadow-xl relative cursor-pointer
                             hover:scale-105 transition"
                >
                  <h2 className="text-xl font-semibold text-yellow-200 mb-2">
                    {space.name}
                  </h2>

                  <p className="text-sm text-white/80 mb-2">
                    {space.members.length} members inside
                  </p>

                  {isCreator && (
                    <>
                      <p className="text-yellow-300 text-sm mb-4">
                        Me (Admin)
                      </p>

                      {/* Stop propagation so delete doesn't navigate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(space)
                        }}
                        className="text-red-300 text-sm hover:text-red-500 transition"
                      >
                        Delete Space
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-[#8B5A2B] p-8 rounded-2xl border border-[#5A3B1C] shadow-2xl w-[400px]">

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
                  onClick={() =>
                    deleteSpace(deleteTarget.id)
                  }
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