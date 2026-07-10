"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-[var(--bg-glass)] border-b border-[var(--border-subtle)]" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-[var(--accent-bright)] text-xl">◈</span>
          <span className="font-semibold">Verse</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <a href="#how" className="hover:text-white transition-colors duration-200">How it works</a>
          <a href="#cta" className="hover:text-white transition-colors duration-200">Community</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signin"
            className="rounded-lg border border-[var(--border-default)] hover:border-[var(--accent)] px-4 py-2 text-sm transition-colors duration-200">
            Sign In
          </Link>
          <Link href="/verse"
            className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-bright)] px-5 py-2 text-sm font-medium text-white transition-colors duration-200">
            Enter the Verse →
          </Link>
        </div>
      </div>
    </nav>
  )
}
