import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Landing from "@/components/space/landing"

export default async function VersePage() {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  return <Landing userName={session.user?.name || "Creator"} />
}
