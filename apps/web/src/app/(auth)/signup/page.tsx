"use client"

import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { GitHubLogo, GoogleLogo } from "@/components/auth/SocialLogos"
import { apiFetch, getApiBaseUrl } from "@/lib/api"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import LogoText from "@/components/home/LogoText"

export default function SignUpPage() {
  const router = useRouter()
  const { status, refreshSession } = useAuthSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status !== "authenticated") return
    router.replace("/dashboard")
  }, [router, status])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuthRetry: true,
      })
      await refreshSession()
      router.replace("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign up")
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${getApiBaseUrl()}/api/auth/${provider}`
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 absolute top-0 left-0 right-0 z-10">
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

      {/* Split layout */}
      <div className="flex flex-1 min-h-screen">
        {/* Left panel — branding */}
        <div
          className="hidden lg:flex flex-col justify-center px-16 w-[45%] relative overflow-hidden"
          style={{ background: "var(--bg-alt)", borderRight: "1px solid var(--card-border)" }}
        >
          {/* Ambient orbs */}
          <div
            className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none animate-orb"
            style={{ background: "var(--orb-1)" }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: "var(--orb-2)", animationDelay: "2s" }}
          />

          <div className="relative z-10 max-w-sm">
            <Link href="/">
              <LogoText className="text-4xl mb-8 block" textClassName="text-[var(--text)]" />
            </Link>
            <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: "var(--text)" }}>
              Build your team&apos;s{" "}
              <span className="gradient-text">virtual home.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Create a space where your team walks, talks, and works together — no commute required.
            </p>

            <div className="mt-10 flex flex-col gap-3">
              {[
                { icon: "🚀", label: "Set up your space in seconds" },
                { icon: "👥", label: "Invite your whole team instantly" },
                { icon: "🔒", label: "Secure, private, and always on" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Create your account</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Join TwoDverse — it&apos;s free to start</p>
            </div>

            {/* Card */}
            <div
              className="rounded-2xl border p-8"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* OAuth */}
              <div className="flex flex-col gap-3 mb-6">
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

              <div className="flex items-center gap-3 mb-6">
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
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text)",
                  }}
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password (8+ chars, uppercase, number, special)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                  style={{
                    background: "var(--input-bg)",
                    borderColor: "var(--input-border)",
                    color: "var(--text)",
                  }}
                />

                {error && (
                  <p className="text-xs" style={{ color: "#f87171" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--accent)" }}
                >
                  {loading ? "Creating account…" : "Sign Up"}
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link href="/signin" className="font-medium hover:underline" style={{ color: "var(--accent)" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
