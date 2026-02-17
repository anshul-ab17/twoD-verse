"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Hero3D from "./hero-3d"

interface HomeProps {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: HomeProps) {
  const href = isAuthenticated ? "/space" : "/signin"
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-focus so WASD works instantly
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-screen w-full overflow-hidden bg-black text-white outline-none"
    >
      {/* Interactive 3D Background */}
      <Hero3D />

      {/* Center Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight drop-shadow-2xl">
          Enter the World
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/70">
          Build playful spaces. Explore ideas.
          Shape mysterious digital realms.
        </p>

        <Link
          href={href}
          className="mt-10 rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:scale-105 pointer-events-auto"
        >
          Start Exploring
        </Link>
      </div>
    </div>
  )
}
