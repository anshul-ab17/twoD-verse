import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Home from "@/components/home/hero"
 
export default async function HomePage() {
  const session = await auth()

  if (session) {
    redirect("/space/dashboard")
  }

  return <Home isAuthenticated={false} />
}
