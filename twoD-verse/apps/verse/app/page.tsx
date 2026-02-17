import { auth } from "@/lib/auth"
import Home from "@/components/home/hero"

export default async function HomePage() {
  const session = await auth()
  return <Home isAuthenticated={!!session} />
}
