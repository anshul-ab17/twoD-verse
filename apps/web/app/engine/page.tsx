import dynamic from "next/dynamic"

const PhaserGame = dynamic(
  () => import("@/components/game/PhaserGame"),
  { ssr: false }
)

export default function EnginePage({
  params,
}: {
  params: { spaceId: string }
}) {
  return (
    <PhaserGame
      spaceId={params.spaceId}
      userName="Player"
    />
  )
}