"use client"

import Hero from "@/components/home/Hero"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { GitHubLogo, GoogleLogo } from "@/components/auth/SocialLogos"
import { apiFetch, getApiBaseUrl } from "@/lib/api"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

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
      const message = err instanceof Error ? err.message : "Unable to sign in"
      setError(message)
    } finally {
      setLoading(false)
    }
  }
  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${getApiBaseUrl()}/api/auth/${provider}`
  }

  return (
    <Hero overlay="bg-black/40" blur="backdrop-blur-xl">
      <div className="w-full max-w-6xl grid grid-cols-2 gap-16 text-white">
        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Build Your
            <br />
            Virtual Space.
          </h1>

          <p className="text-lg text-white/80 mb-8">
            Start creating shared digital rooms,
            invite your team, and collaborate live.
          </p>

          <p className="text-sm text-white/60">
            TwoDverse makes it effortless.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Welcome Back
          </h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              <GoogleLogo className="h-5 w-5" />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 rounded-lg border border-white/20 hover:bg-gray-900 transition"
            >
              <GitHubLogo className="h-5 w-5" />
              Continue with GitHub
            </button>

            <div className="text-center text-sm text-white/60 my-4">
              or
            </div>

            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full p-3 rounded-lg bg-black/40 border border-white/20"
            />

            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full p-3 rounded-lg bg-black/40 border border-white/20"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#556B2F] hover:bg-[#6B8E23] disabled:opacity-60 text-white p-3 rounded-lg font-semibold transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {error && <p className="text-sm text-red-300">{error}</p>}
          </form>

          <div className="mt-6 text-center text-sm text-white/70">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline text-[#E59E2D]">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </Hero>
  )
}
