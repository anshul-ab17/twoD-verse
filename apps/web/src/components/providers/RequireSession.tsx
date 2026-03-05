"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthSession } from "./AuthSessionProvider"

export default function RequireSession({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { status } = useAuthSession()

  useEffect(() => {
    if (status !== "unauthenticated") return

    const next = encodeURIComponent(pathname || "/dashboard")
    router.replace(`/signin?next=${next}`)
  }, [pathname, router, status])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-yellow-200">
        Checking session...
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return <>{children}</>
}
