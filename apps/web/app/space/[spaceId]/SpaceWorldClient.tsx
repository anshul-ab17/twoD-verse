"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import WorldCanvas from "@/components/world/WorldCanvas"
import SidePanel from "@/components/space/SidePanel"

type Props = {
  spaceId: string
  userName: string
}

export default function SpaceWorldClient({
  spaceId,
  userName,
}: Props) {
  const router = useRouter()
  const [spaceName, setSpaceName] = useState<string | null>(null)

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("twodverse-spaces") || "[]")

    const space = stored.find((s: any) => s.id === spaceId)

    if (!space) {
      router.replace("/space/dashboard")
      return
    }

    setSpaceName(space.name)
  }, [spaceId, router])


  if (!spaceName) return null

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-neutral-950">
      <WorldCanvas userName={userName} />
      <SidePanel userName={userName} spaceName={spaceName} />
    </div>
  )
}
