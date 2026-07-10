"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { login, signup } from "../../lib/auth"

function SigninForm() {
  const router = useRouter()
  const next = useSearchParams().get("next") ?? "/verse"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (fn: typeof login) => {
    setBusy(true)
    setError("")
    try {
      await fn(email, password)
      router.push(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "auth failed")
      setBusy(false)
    }
  }

  const field =
    "w-full rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors duration-200"

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 text-[var(--text-primary)]">
          <span className="text-[var(--accent-bright)] text-xl">◈</span>
          <span className="font-semibold text-lg">Verse</span>
        </Link>
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8">
          <h1 className="text-lg font-semibold mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Sign in to enter the world.</p>
          <div className="flex flex-col gap-3">
            <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" type="email" />
            <input className={field} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password"
              onKeyDown={(e) => e.key === "Enter" && submit(login)} />
          </div>
          <div className="flex gap-3 mt-6">
            <button disabled={busy} onClick={() => submit(login)}
              className="flex-1 rounded-[999px] bg-[var(--accent)] hover:bg-[var(--accent-bright)] disabled:opacity-50 text-white text-sm font-semibold py-2.5 transition-colors duration-200">
              {busy ? "…" : "Log in"}
            </button>
            <button disabled={busy} onClick={() => submit(signup)}
              className="flex-1 rounded-[999px] border border-[var(--border-default)] hover:border-[var(--accent)] disabled:opacity-50 text-sm font-medium py-2.5 transition-colors duration-200">
              Sign up
            </button>
          </div>
          {error && <div className="mt-4 text-sm text-[var(--danger)]">{error}</div>}
        </div>
      </div>
    </main>
  )
}

export default function SigninPage() {
  return (
    <Suspense>
      <SigninForm />
    </Suspense>
  )
}
