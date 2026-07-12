"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuthSession } from "@/features/auth/AuthSessionProvider"

function TwoDVerseLogo({ className = "text-black" }: { className?: string }) {
  return (
    <div className="relative w-7 h-7 flex items-center justify-center select-none">
      <svg viewBox="0 0 24 24" className={`w-full h-full fill-none stroke-current stroke-[2.5] ${className}`}>
        <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="2.5" />
        <circle cx="12" cy="12" r="2.5" className="fill-current" />
        <line x1="12" y1="3" x2="12" y2="21" className="opacity-20" />
        <line x1="3" y1="12" x2="21" y2="12" className="opacity-20" />
      </svg>
    </div>
  )
}

export function LandingNav({
  phase = "done",
  onOpenAuth,
}: {
  phase?: "loading" | "exit" | "done"
  onOpenAuth?: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut } = useAuthSession()

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
      style={{
        opacity: phase !== "loading" ? 1 : 0,
        transform: `translateY(${phase !== "loading" ? 0 : -14}px)`,
        transition: "opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "22px 4.5vw", width: "100%", boxSizing: "border-box" }}
      >
        <Link href="/" className="flex items-center" style={{ opacity: phase === "done" ? 1 : 0 }}>
          <span style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontStretch: "140%", fontSize: "19px", letterSpacing: "-0.02em", color: "#111111" }}>
            TwoD VERSE
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[12px] font-sans font-bold text-[#111111] uppercase tracking-wider">
          <a href="/#features" className="hover:text-black/60 transition-colors duration-150">Product</a>
          <a href="#themes" className="hover:text-black/60 transition-colors duration-150">Themes</a>
          <a href="/#how" className="hover:text-black/60 transition-colors duration-150">Spaces</a>
          <a href="/#services" className="hover:text-black/60 transition-colors duration-150">Pricing</a>
          <a href="#" className="hover:text-black/60 transition-colors duration-150">Journal</a>
        </div>

        <div className="flex items-center gap-3" style={{ opacity: phase === "done" ? 1 : 0 }}>
          {user ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => signOut()}
                className="text-[11px] font-mono uppercase tracking-wider text-black/60 hover:text-black transition-all duration-150 cursor-pointer"
              >
                Log Out
              </button>
              <Link
                href="/spaces"
                className="rounded-[100px] bg-[#111111] hover:bg-[#333333] text-white px-6 py-2.5 text-[11px] font-bold font-sans uppercase tracking-wider transition-all duration-150"
              >
                Go to Space
              </Link>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-[100px] bg-[#111111] hover:bg-[#333333] text-white text-[11px] font-bold font-sans uppercase tracking-wider transition-all duration-150 flex items-center justify-center cursor-pointer"
              style={{ width: "116px", height: "39px", borderRadius: "999px", fontFamily: "'Space Grotesk', sans-serif" }}
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
