import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { client } from "@repo/db"
import DashboardView from "@/components/space/dashboard/DashboardView"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/signin")
  }

  const userId = session.user.id

  const spaces = await client.space.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  async function deleteSpace(id: string) {
    "use server"

    await client.space.delete({
      where: { id },
    })
  }

  return (
    <DashboardView
      spaces={spaces}
      deleteSpace={deleteSpace}
    />
  )
}
