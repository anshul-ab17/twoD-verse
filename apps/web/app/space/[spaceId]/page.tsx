import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import SpaceWorldClient from "@/components/game/SpaceWorldClient"

export default async function SpaceWorldPage({
  params,
}: {
  params: { spaceId: string }
}) {
  const session = await auth()

  if (!session) redirect("/signin")

  const { spaceId } = params

  return (
    <SpaceWorldClient
      spaceId={spaceId}
      userName={session.user?.name ?? "Creator"}
    />
  )
}
