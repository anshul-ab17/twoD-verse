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

  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-screen w-full text-white outline-none overflow-hidden"
    >
      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight drop-shadow-2xl">
          Create own Space
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/70">
          Build playful spaces. Explore ideas.
          Shape mysterious digital realms.
        </p>

        <Link
          href={href}
          className="mt-10 rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:scale-105"
        >
          Start Exploring
        </Link>
      </div>
    </div>
  )
}
