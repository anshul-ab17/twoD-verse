"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const { data: session } = useSession()

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
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm font-medium hover:underline"
          >
            Logout
          </button>
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
