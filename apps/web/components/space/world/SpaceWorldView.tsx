"use client"

import { useEffect, useState } from "react"
import WorldCanvas from "@/components/world/WorldCanvas"
import SidePanel from "@/components/space/SidePanel"

type Props = {
  spaceId: string
}

export default function SpaceWorldView({ spaceId }: Props) {
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
      <WorldCanvas />
      <SidePanel spaceName={spaceName} />
    </div>
  )
}
