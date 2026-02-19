import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { client } from "@repo/db"
import CreateSpaceView from "@/components/space/create/CreateSpaceView"

export default async function CreateSpacePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/signin")
  }

  const userId = session.user.id

  async function createSpace(formData: FormData) {
    "use server"

    const name = formData.get("name") as string
    if (!name?.trim()) return

    const space = await client.space.create({
      data: {
        name,
        userId,
      },
    })

    redirect(`/space/${space.id}`)
  }

  return <CreateSpaceView createSpace={createSpace} />
}
