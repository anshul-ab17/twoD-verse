"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Hero from "@/components/home/Hero"

export default function CreateSpacePage() {
  const [name, setName] = useState("")
  const router = useRouter()

  const handleCreate = () => {
    if (!name.trim()) return

    const spaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const currentUser = JSON.parse(
      localStorage.getItem("currentUser")!
    )

    const newSpace = {
      id: crypto.randomUUID(),
      name,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      members: [currentUser],
    }

    localStorage.setItem(
      "spaces",
      JSON.stringify([...spaces, newSpace])
    )

    // Redirect to invite screen
    router.push(`/dashboard/spaces/${newSpace.id}/invite`)
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
            onChange={(e) => setName(e.target.value)}
            placeholder="Space Name"
            className="w-full p-3 rounded-lg text-black mb-4"
          />

          <button
            onClick={handleCreate}
            className="w-full py-3 bg-[#556B2F]
                       hover:bg-[#6B8E23]
                       rounded-lg font-semibold transition"
          >
            Create Space
          </button>

        </div>
      </div>
    </Hero>
  )
}