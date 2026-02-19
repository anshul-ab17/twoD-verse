"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import SidePanel from "@/components/space/SidePanel"

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame"),
  { ssr: false }
)

type SpaceWorldClientProps = {
  spaceId: string
  userName: string
  spaceName: string    
}

export default function SpaceWorldClient({
  spaceId,
  userName,
  spaceName,
}: SpaceWorldClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950">

      <SidePanel
        userName={userName}
        spaceName={spaceName}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div
        className={`h-full transition-all duration-300
        ${sidebarOpen ? "ml-80" : "ml-0"}`}
      >
        <PhaserGame spaceId={spaceId} userName={userName} />
      </div>

    </div>
  )
}
