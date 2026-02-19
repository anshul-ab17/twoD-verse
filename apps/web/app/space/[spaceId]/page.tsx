import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { client } from "@repo/db";
import SpaceWorldClient from "@/components/game/SpaceWorldClient"

export const dynamic = "force-dynamic"

export default async function SpaceWorldPage({
  params,
}: {
  params: { spaceId: string }
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/signin")
  }

  const space = await client.space.findFirst({
    where: {
      id: params.spaceId,
      userId: session.user.id,
    },
  })

  if (!space) {
    redirect("/space/dashboard")
  }

  return (
    <SpaceWorldClient
      spaceId={space.id}
      spaceName={space.name}
      userName={session.user.name ?? "Creator"}
    />
  )
}
