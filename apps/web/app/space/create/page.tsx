import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { client } from "@repo/db"
import CreateSpaceView from "@/components/space/create/CreateSpaceView"

export default async function CreateSpacePage() {
  const session = await auth()

  if (!session?.user?.email) {
    redirect("/signin")
  }

  async function createSpace(formData: FormData) {
    "use server"

    const session = await auth()

    if (!session?.user?.email) {
      redirect("/signin")
    }

    const user = await client.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      redirect("/signin")
    }

    const name = formData.get("name") as string

    if (!name?.trim()) {
      throw new Error("Space name is required")
    }

    const space = await client.space.create({
      data: {
        name,
        width: 800,
        height: 600,
        creatorId: user.id,
      },
    })

    redirect(`/space/${space.id}`)
  }

  return <CreateSpaceView createSpace={createSpace} />
}