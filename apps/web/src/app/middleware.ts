import { type NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const hasToken = req.cookies.has("accessToken")
  if (!hasToken) {
    const next = encodeURIComponent(req.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/signin?next=${next}`, req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/spaces/:path*"],
}
