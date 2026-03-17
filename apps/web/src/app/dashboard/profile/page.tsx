"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthSession } from "@/components/providers/AuthSessionProvider"
import { apiFetch } from "@/lib/api"
import { ArrowLeft, KeyRound, LogOut, User } from "lucide-react"

const CHARACTERS = [
  { key: "adam", label: "Adam" },
  { key: "ash",  label: "Ash"  },
  { key: "lucy", label: "Lucy" },
  { key: "nancy",label: "Nancy"},
] as const

type CharKey = typeof CHARACTERS[number]["key"]

function readCharacter(): CharKey {
  if (typeof window === "undefined") return "adam"
  return (localStorage.getItem("twodverse:character") as CharKey) || "adam"
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut } = useAuthSession()

  const [character, setCharacter] = useState<CharKey>(readCharacter)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword]         = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwLoading, setPwLoading]             = useState(false)
  const [pwError, setPwError]                 = useState("")
  const [pwSuccess, setPwSuccess]             = useState(false)

  if (!user) return null

  const initial = user.name?.[0]?.toUpperCase() ?? "?"
  const isEmailAccount = !user.email.includes("@") === false // always true; password change shown based on error from server

  const handleCharacter = (key: CharKey) => {
    setCharacter(key)
    localStorage.setItem("twodverse:character", key)
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPwError("")
    setPwSuccess(false)
    if (newPassword !== confirmPassword) { setPwError("Passwords don't match"); return }
    if (newPassword.length < 8) { setPwError("New password must be at least 8 characters"); return }
    setPwLoading(true)
    try {
      await apiFetch("/api/auth/me/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setPwSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setPwLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/signin")
  }

  const border = "var(--card-border)"
  const cardBg = "var(--bg-card)"
  const text    = "var(--text)"
  const muted   = "var(--text-muted)"
  const accent  = "var(--accent)"

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: text, padding: "2rem 1.5rem" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* Back */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-8 flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: muted }}
        >
          <ArrowLeft size={15} /> Back to dashboard
        </button>

        {/* Avatar + identity */}
        <div
          className="rounded-2xl border p-6 mb-6 flex items-center gap-5"
          style={{ background: cardBg, borderColor: border }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: "var(--accent-bg)", color: accent, border: `2px solid ${accent}` }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold truncate" style={{ color: text }}>{user.name}</p>
            <p className="text-sm truncate" style={{ color: muted }}>{user.email}</p>
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{ background: "var(--accent-bg)", color: accent, border: `1px solid ${accent}` }}
            >
              {user.role}
            </span>
          </div>
        </div>

        {/* Character picker */}
        <div
          className="rounded-2xl border p-6 mb-6"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="flex items-center gap-2 mb-4">
            <User size={16} style={{ color: accent }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Game Character</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {CHARACTERS.map(({ key, label }) => {
              const active = character === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCharacter(key)}
                  className="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: active ? accent : border,
                    background: active ? "var(--accent-bg)" : "var(--bg)",
                    color: active ? accent : muted,
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-full text-lg flex items-center justify-center font-bold"
                    style={{ background: "var(--bg-card)", color: active ? accent : text }}
                  >
                    {label[0]}
                  </div>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11px]" style={{ color: muted }}>
            Your character in all spaces. Takes effect next time you enter a space.
          </p>
        </div>

        {/* Password change */}
        <div
          className="rounded-2xl border p-6 mb-6"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} style={{ color: accent }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Change Password</h2>
          </div>
          <form onSubmit={(e) => void handlePasswordChange(e)} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg)", borderColor: border, color: text }}
            />
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg)", borderColor: border, color: text }}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={{ background: "var(--bg)", borderColor: border, color: text }}
            />

            {pwError && (
              <p className="text-xs" style={{ color: "#f87171" }}>{pwError}</p>
            )}
            {pwSuccess && (
              <p className="text-xs" style={{ color: "#4ade80" }}>Password updated successfully.</p>
            )}

            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: accent, color: "#fff" }}
            >
              {pwLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <div
          className="rounded-2xl border p-6"
          style={{ background: cardBg, borderColor: border }}
        >
          <div className="flex items-center gap-2 mb-4">
            <LogOut size={16} style={{ color: "#f87171" }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Session</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: muted }}>
            Sign out of your account on this device.
          </p>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ borderColor: "#f87171", color: "#f87171", background: "transparent" }}
          >
            Sign out
          </button>
        </div>

      </div>
    </div>
  )
}
