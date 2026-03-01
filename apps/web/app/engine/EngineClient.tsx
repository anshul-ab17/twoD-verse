"use client"
import dynamic from "next/dynamic"

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame"),
  { ssr: false }
)

export default function EngineClient({
  spaceId,
}: {
  spaceId: string
}) {
  return (
    <PhaserGame
      spaceId={spaceId}
      userName="Player"
    />
  )
}