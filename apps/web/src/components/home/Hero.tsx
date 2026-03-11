"use client"

import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import LogoText from "./LogoText"

type HeroProps = {
  children: React.ReactNode
  blur?: string
  overlay?: string
}

type Particle = {
  left: string
  top: string
  delay: string
}

const PARTICLES: Particle[] = [
  { left: "8%", top: "12%", delay: "0.4s" },
  { left: "22%", top: "65%", delay: "1.1s" },
  { left: "34%", top: "28%", delay: "2.2s" },
  { left: "46%", top: "78%", delay: "0.9s" },
  { left: "58%", top: "18%", delay: "1.8s" },
  { left: "69%", top: "52%", delay: "2.7s" },
  { left: "77%", top: "33%", delay: "1.4s" },
  { left: "84%", top: "72%", delay: "3.1s" },
  { left: "14%", top: "43%", delay: "2.5s" },
  { left: "28%", top: "84%", delay: "0.7s" },
  { left: "63%", top: "69%", delay: "1.6s" },
  { left: "91%", top: "24%", delay: "2.9s" },
]

export default function Hero({
  children,
  blur = "",
  overlay = "bg-black/5",
}: HeroProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { status, signOut } = useAuthSession()
  const isHome = pathname === "/"
  const isAuthenticated = status === "authenticated"

  const particles = PARTICLES
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await signOut()
    router.replace("/signin")
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 animate-slowZoom"
          style={{ backgroundImage: "url('/office.webp')" }}
        />

        {/* Soft radial lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_70%)]" />
      </div>

      {/* Subtle Overlay */}
      {overlay && (
        <div className={`absolute inset-0 ${overlay}`} />
      )}

      {/* Floating Particles (hydration safe) */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 bg-yellow-200/40 rounded-full animate-float"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Blur Layer */}
      {blur && <div className={`absolute inset-0 ${blur}`} />}

      {/* Top Bar */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-20">

        {/* Brand */}
        <LogoText className="text-2xl drop-shadow-lg" textClassName="text-white" />

        <div className="flex items-center gap-3">

          {/* Sign Out (for authenticated users) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-4 py-1.5 text-sm font-semibold
                         bg-[#2f2f2f] text-white
                         border border-[#4a4a4a]
                         rounded-lg
                         shadow-md hover:shadow-lg
                         hover:-translate-y-1
                         transition-all duration-200 disabled:opacity-60"
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          )}

          {/* Sign In (only on home) */}
          {isHome && !isAuthenticated && (
            <Link
              href="/signin"
              className="px-4 py-1.5 text-sm font-semibold
                         bg-[#8B5A2B] text-yellow-200
                         border border-[#5A3B1C]
                         rounded-lg
                         shadow-md hover:shadow-lg
                         hover:-translate-y-1
                         transition-all duration-200"
            >
              Sign In
            </Link>
          )}

          {/* Home Button */}
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center
                       bg-[#8B5A2B]
                       border border-[#5A3B1C]
                       rounded-full
                       shadow-md hover:shadow-lg
                       hover:-translate-y-1
                       transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-yellow-200"
            >
              <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" />
            </svg>
          </Link>

        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  )
}
