"use client"

import { useWorldStore } from "@/store/useWorldStore"

type Props = {
  userName?: string
  spaceName?: string
}

export default function SidePanel({ userName, spaceName }: Props) {
  const currentZone = useWorldStore((s) => s.currentZone)

  return (
    <div className="absolute right-0 top-0 h-full w-72 bg-neutral-900/80 backdrop-blur-md border-l border-neutral-800 p-4 text-white">
      <h2 className="text-sm font-semibold mb-4">
        {spaceName}
      </h2>

      <p className="mb-4">
        Welcome, <span className="text-indigo-400">{userName}</span>
      </p>

      <div className="text-sm">
        <p className="mb-2">Current Zone:</p>
        <div className="p-3 bg-neutral-800 rounded-md">
          {currentZone ?? "None"}
        </div>
        <button
        onClick={() => window.location.href = "/space/dashboard"}
        className="mt-6 w-full bg-red-600 py-2 rounded"
        >
        Leave Space
        </button>

      </div>
    </div>
  )
}
