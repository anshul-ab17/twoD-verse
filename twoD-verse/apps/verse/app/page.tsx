import { cookies } from "next/headers"
import Link from "next/link"

export default async function HomePage() {
  const cookieStore = await cookies()
  const user = cookieStore.get("twodverse-user")

  const href = user?.value ? "/verse" : "/signin"

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between px-8 py-6">
        <h1 className="text-xl font-semibold tracking-wide">
          Twodverse
        </h1>
        <Link
          href="/signin"
          className="text-sm font-medium hover:underline"
        >
          Sign In
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <Link
          href={href}
          className="rounded-xl bg-black px-10 py-6 text-xl font-bold text-white transition hover:scale-105 md:text-l"
        >
          Create Your Verse
        </Link>
      </div>
    </div>
  )
}
