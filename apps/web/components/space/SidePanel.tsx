"use client"

import { useRouter } from "next/navigation"

type Props = {
  spaceName: string
  userName: string
}

export default function SidePanel({ spaceName, userName }: Props) {
  const router = useRouter()

  return (
    <div className="absolute left-0 top-0 h-full w-80
                    bg-black/70 backdrop-blur-xl
                    border-r border-white/10
                    p-6 flex flex-col justify-between">

      <div className="space-y-8">

        <div>
          <h2 className="text-lg font-semibold text-white/80">
            {spaceName}
          </h2>

          <p className="text-sm text-white/50 mt-2">
            Logged in as {userName}
          </p>
        </div>

      </div>

      <div className="space-y-4">

        <button
          onClick={() => router.push("/space/dashboard")}
          className="w-full bg-red-950 py-2 rounded-lg hover:bg-neutral-700 transition"
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  )
}
