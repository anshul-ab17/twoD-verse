import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { client } from "@repo/db"
import DashboardView from "@/components/space/dashboard/DashboardView"

export const dynamic = "force-dynamic"
export default async function DashboardPage() {
  
  const session = await auth()  
  console.log("SERVER SESSION:", session)
  if (!session?.user?.email) {
    redirect("/signin")
  }

  let user = await client.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    user = await client.user.create({
      data: {
        email: session.user.email,
        provider: "GOOGLE",
        role: "USER",
      },
    })
  }

  const spaces = await client.space.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  })

  async function deleteSpace(id: string) {
    "use server"

    await client.space.delete({
      where: { id },
    })
  }
  console.log("SERVER SESSION:", session)

  return (
    <DashboardView
      spaces={spaces}
      deleteSpace={deleteSpace}
    />
  )
}