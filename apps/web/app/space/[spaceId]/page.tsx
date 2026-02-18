import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SpaceWorldView from "@/components/space/world/SpaceWorldView"

export default async function SpaceWorldPage({
  params,
}: {
  params: Promise<{ spaceId: string }>
}) {
  const session = await auth()

  if (!session) redirect("/signin")

  const { spaceId } = await params

  return (
    <SpaceWorldView
      spaceId={spaceId}
      userName={session.user?.name ?? "Creator"}
    />
  )
}
