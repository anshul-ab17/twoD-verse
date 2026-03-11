"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { useRouter } from "next/navigation"
import { Sun, Moon, Menu, X } from "lucide-react"
import LogoText from "./LogoText"

export type SiteTheme = "dark" | "light"

export default function LandingNavbar() {
  const [theme, setTheme] = useState<SiteTheme>("dark")
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { status, signOut } = useAuthSession()
  const router = useRouter()

  const isAuth = status === "authenticated"

  // Init theme from localStorage once on mount
  useEffect(() => {
    const saved = (localStorage.getItem("twodverse:site-theme") as SiteTheme) || "dark"
    document.documentElement.setAttribute("data-theme", saved)
    setTheme(saved)
  }, [])

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const toggleTheme = () => {
    const next: SiteTheme = theme === "dark" ? "light" : "dark"
    document.documentElement.setAttribute("data-theme", next)
    localStorage.setItem("twodverse:site-theme", next)
    setTheme(next)
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    await signOut()
    router.replace("/signin")
  }

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Spaces", href: "/dashboard/spaces" },
  ]

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: "var(--nav-bg)",
        borderBottom: `1px solid ${scrolled ? "var(--nav-border)" : "transparent"}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center select-none">
          <LogoText className="text-xl" textClassName="text-[var(--text)]" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium transition-colors duration-150"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-150"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--card-border)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--accent)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--card-border)"
              ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Auth CTA */}
          {isAuth ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/dashboard"
                className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--card-border)",
                  color: "var(--text-muted)",
                }}
              >
                {signingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  background: "var(--accent)",
                  color: "#fff",
                  boxShadow: "0 2px 12px var(--accent-bg)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent)")}
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border transition"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--card-border)",
              color: "var(--text-muted)",
            }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-6 py-4 flex flex-col gap-3"
          style={{ background: "var(--nav-bg)", borderColor: "var(--nav-border)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-2 text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t" style={{ borderColor: "var(--divider)" }}>
            {isAuth ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-left py-2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-4 py-2 text-center text-sm font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
