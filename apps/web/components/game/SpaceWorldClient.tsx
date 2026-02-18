"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import SidePanel from "@/components/space/SidePanel"

const PhaserGame = dynamic(
  () => import("./PhaserGame"),
  { ssr: false }
)

type Props = {
  spaceId: string
  userName: string
}

export default function SpaceWorldClient({
  spaceId,
  userName,
}: Props) {
  const [spaceName, setSpaceName] = useState<string>("Loading...")

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")

    const space = stored.find((s: any) => s.id === spaceId)

    if (space) {
      setSpaceName(space.name)
    } else {
      setSpaceName("Untitled Space")
    }
  }, [spaceId])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950">

      <SidePanel userName={userName} spaceName={spaceName} />

      <div className="pl-80 h-full w-full">
        <PhaserGame />
      </div>

    </div>
  )
}
