import Link from "next/link"
import { auth } from "@/lib/auth"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function HomePage() {
  const session = await auth()

  const href = session ? "/verse" : "/signin"

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex items-center justify-between px-8 py-6">
        <h1 className="text-xl font-semibold tracking-wide">
          Twodverse
        </h1>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          {session ? (
            <Link
              href="/api/auth/signout"
              className="text-sm font-medium hover:underline"
            >
              Logout
            </Link>
          ) : (
            <Link
              href="/signin"
              className="text-sm font-medium hover:underline"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Link
          href={href}
          className="rounded-xl bg-foreground px-10 py-6 text-xl font-bold text-background transition-transform duration-300 hover:scale-105 md:text-3xl"
        >
          Create Your Verse
        </Link>
      </div>
    </div>
  )
}
