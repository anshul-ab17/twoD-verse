"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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

export default function Hero({
  children,
  blur = "",
  overlay = "bg-black/5",
}: HeroProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"

  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const generated = Array.from({ length: 12 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
    }))
    setParticles(generated)
  }, [])

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
        <div className="text-white text-2xl font-extrabold tracking-wide drop-shadow-lg">
          TwoD<span className="text-[#E59E2D]">verse</span>
        </div>

        <div className="flex items-center gap-3">

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

          {/* Sign In (only on home) */}
          {isHome && (
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

        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  )
}