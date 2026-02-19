"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import SidePanel from "@/components/space/SidePanel"

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame"),
  { ssr: false }
)

export default function SpaceWorldClient({
  spaceId,
  userName,
}: {
  spaceId: string
  userName: string
}) {
  const [spaceName, setSpaceName] = useState("Loading...")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")

    const space = stored.find((s: any) => s.id === spaceId)

    setSpaceName(space?.name ?? "Untitled Space")
  }, [spaceId])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950">

      {/* Sidebar */}
      <SidePanel
        userName={userName}
        spaceName={spaceName}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* Phaser Area */}
      <div
        className={`h-full transition-all duration-300
        ${sidebarOpen ? "ml-80" : "ml-0"}`}
      >
        <PhaserGame spaceId={spaceId} userName={userName} />
      </div>

    </div>
  )
}
