import SpaceWorldView from "@/components/space/world/SpaceWorldView"

export default function SpaceWorldPage({
  params,
}: {
  params: { spaceId: string }
}) {
  return <SpaceWorldView spaceId={params.spaceId} />
}
