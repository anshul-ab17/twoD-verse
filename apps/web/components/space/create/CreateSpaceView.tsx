"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function CreateSpaceView() {
  const [name, setName] = useState("")
  const router = useRouter()

  const handleCreate = () => {
    if (!name.trim()) return

    const newSpace = {
      id: crypto.randomUUID(),
      name,
    }

    const existing =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")

    const updated = [...existing, newSpace]

    localStorage.setItem("twodverse-spaces", JSON.stringify(updated))

    router.push(`/space/${newSpace.id}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 w-80">
        <h1 className="text-xl font-semibold">
          Create Space
        </h1>

        <input
          className="w-full bg-neutral-800 p-2 rounded outline-none"
          placeholder="Space name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="w-full bg-indigo-600 py-2 rounded hover:bg-indigo-500"
        >
          Create Space
        </button>
      </div>
    </div>
  )
}
