"use client"

import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { GitHubLogo, GoogleLogo } from "@/components/auth/SocialLogos"
import { apiFetch, getApiBaseUrl } from "@/lib/api"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import LogoText from "@/components/home/LogoText"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, refreshSession } = useAuthSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const nextPath = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    if (status !== "authenticated") return
    router.replace(nextPath)
  }, [nextPath, router, status])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuthRetry: true,
      })
      await refreshSession()
      router.replace(nextPath)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${getApiBaseUrl()}/api/auth/${provider}`
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <LogoText className="text-xl" textClassName="text-[var(--text)]" />
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition hover:opacity-80"
          style={{ borderColor: "var(--card-border)", color: "var(--text-muted)", background: "var(--bg-card)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </Link>
      </header>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div
          className="w-full max-w-3xl rounded-2xl border overflow-hidden flex"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--card-border)",
            boxShadow: "var(--shadow-card)",
            minHeight: "480px",
          }}
        >
          {/* Left — branding */}
          <div
            className="hidden md:flex flex-col justify-between p-10 w-[44%] relative overflow-hidden"
            style={{ background: "var(--bg-alt)", borderRight: "1px solid var(--card-border)" }}
          >
            {/* Orbs */}
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none animate-orb"
              style={{ background: "var(--orb-1)", transform: "translate(-40%, -40%)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
              style={{ background: "var(--orb-2)", transform: "translate(30%, 30%)" }}
            />

            <div className="relative z-10">
              <LogoText className="text-2xl" textClassName="text-[var(--text)]" />
            </div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold leading-snug mb-3" style={{ color: "var(--text)" }}>
                Your virtual office,{" "}
                <span className="gradient-text">anywhere.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
                Walk around, meet your team, and collaborate in a real-time 2D space.
              </p>
              <div className="flex flex-col gap-2.5">
                {[
                  { icon: "🗺️", label: "Real-time 2D movement" },
                  { icon: "🎙️", label: "Proximity voice & video" },
                  { icon: "💬", label: "Global and nearby chat" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="text-base">{icon}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — form */}
          <div className="flex flex-1 flex-col justify-center px-8 py-10">
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Welcome back</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Sign in to your account</p>

            {/* OAuth */}
            <div className="flex flex-col gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                style={{ background: "var(--bg)", borderColor: "var(--card-border)", color: "var(--text)" }}
              >
                <GoogleLogo className="h-4 w-4" />
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("github")}
                className="flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:opacity-80"
                style={{ background: "var(--bg)", borderColor: "var(--card-border)", color: "var(--text)" }}
              >
                <GitHubLogo className="h-4 w-4" />
                Continue with GitHub
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: "var(--divider)" }} />
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--divider)" }} />
            </div>

            {/* Form */}
            <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <input
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text)" }}
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                style={{ background: "var(--input-bg)", borderColor: "var(--input-border)", color: "var(--text)" }}
              />

              {error && <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No account?{" "}
              <Link href="/signup" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
