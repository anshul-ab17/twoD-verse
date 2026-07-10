"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getAccessToken } from "./auth"

/** Client-side gate (tokens are localStorage-only — server can't check them).
 *  Returns the token once known; redirects to /signin when absent. */
export function useAuthGuard(): string | null {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = getAccessToken()
    if (t) setToken(t)
    else router.replace(`/signin?next=${encodeURIComponent(pathname)}`)
  }, [router, pathname])

  return token
}
