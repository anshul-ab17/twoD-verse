"use client"

import Hero from "@/components/home/Hero"
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
        body: JSON.stringify({
          name: name.trim(),
          width: 1600,
          height: 800,
        }),
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
      const message = err instanceof Error ? err.message : "Unable to create space"
      setError(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Hero overlay="bg-black/20" blur="backdrop-blur-md">
      <div className="max-w-xl w-full text-white">
        <div className="bg-[#8B5A2B] p-8 rounded-2xl border border-[#5A3B1C] shadow-xl">
          <h1 className="text-2xl font-bold text-yellow-200 mb-6">
            Create New Space
          </h1>

          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Space Name"
            className="w-full p-3 rounded-lg text-black mb-4"
          />

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 bg-[#556B2F] hover:bg-[#6B8E23] disabled:opacity-60 rounded-lg font-semibold transition"
          >
            {creating ? "Creating..." : "Create Space"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </Hero>
  )
}
