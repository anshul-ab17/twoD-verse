import Link from "next/link"
import { auth, signOut } from "@/lib/auth"

export default async function Navbar() {
  const session = await auth()

  return (
    <header className="absolute top-0 left-0 z-50 w-full flex items-center justify-between px-8 py-6">
      <Link
        href="/"
        className="text-xl font-semibold tracking-widest text-white"
      >
        Twodverse
      </Link>

      <div className="flex items-center gap-4 text-white">

        {session ? (
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="text-sm font-medium hover:underline"
            >
              Logout
            </button>
          </form>
        ) : (
          <Link
            href="/signin"
            className="text-sm font-medium hover:underline"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  )
}
