"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? "backdrop-blur-md bg-white/90 border-b border-black/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-20">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="font-extrabold text-[20px] text-black tracking-tighter uppercase font-sans">Verse</span>
        </Link>
        
        {/* Monospace links matching Afternow navigation menu */}
        <div className="hidden md:flex items-center gap-8 text-[12px] font-mono uppercase tracking-widest text-[#77786d]">
          <a href="#features" className="hover:text-black transition-colors duration-150">Features</a>
          <a href="#how" className="hover:text-black transition-colors duration-150">Sandbox</a>
          <a href="#services" className="hover:text-black transition-colors duration-150">Platform</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="rounded-[100px] border border-black/10 bg-[#f0f0ef] hover:bg-zinc-200 px-5 py-2.5 text-[11px] font-mono uppercase tracking-wider text-black transition-all duration-150"
          >
            Sign In
          </Link>
          <Link
            href="/verse"
            className="rounded-[100px] bg-black hover:bg-zinc-800 text-white px-6 py-2.5 text-[11px] font-bold font-mono uppercase tracking-wider transition-all duration-150"
          >
            Enter Verse
          </Link>
          
          {/* Custom 4-dot Grid Icon */}
          <div className="flex flex-col gap-1 cursor-pointer p-1.5">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
            </div>
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}


