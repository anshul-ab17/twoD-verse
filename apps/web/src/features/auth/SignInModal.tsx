"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { apiFetch, getApiBaseUrl } from "@/lib/api/client"
import { useAuthSession } from "@/features/auth/AuthSessionProvider"

interface SignInModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter()
  const { refreshSession } = useAuthSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleOAuth = (provider: string) => {
    window.location.href = `${getApiBaseUrl()}/api/auth/${provider}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch("/api/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        skipAuthRetry: true,
      })
      await refreshSession()
      onClose()
      router.replace("/spaces")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-[#0e0e11] border border-[#232329] w-full max-w-[420px] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden">

        <div className="relative w-full h-[140px] overflow-hidden bg-zinc-900 border-b border-[#232329]">
          <img src="/signin-art.webp" alt="" className="w-full h-full object-cover opacity-90" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-xs font-bold text-white border border-white/10 cursor-pointer transition-colors duration-150 outline-none"
          >
            ✕
          </button>
        </div>

        <div className="p-7">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7c7c82] uppercase block mb-1">
              TwoD VERSE // authentication
            </span>
            <h2 className="text-[20px] font-extrabold text-white tracking-tight">Welcome to TwoD VERSE</h2>
            <p className="text-[11.5px] text-[#a0a0a5] mt-1.5 font-sans">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-lg text-[11px] font-medium leading-relaxed font-sans">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path fill="#ea4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.74 8.87 5.04 12 5.04z" />
                <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.15-1.98 3.39-4.89 3.39-8.54z" />
                <path fill="#fbbc05" d="M5.36 14.5c-.24-.73-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.5 6.9C.54 8.82 0 10.97 0 13.2c0 2.23.54 4.38 1.5 6.3l3.86-3z" />
                <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.1.74-2.51 1.18-4.29 1.18-3.13 0-5.73-2.7-6.64-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </button>
          </div>

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[#7c7c82] text-[9.5px] font-mono uppercase tracking-widest bg-[#0e0e11] px-2">or sign in with</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full bg-[#171721] border border-[#2d2d39] focus:border-[#5B5BF0] outline-none rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 transition-all duration-150 font-sans"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[#171721] border border-[#2d2d39] focus:border-[#5B5BF0] outline-none rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 transition-all duration-150 font-sans"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black rounded-lg py-3.5 text-xs font-bold transition-all duration-150 uppercase tracking-widest font-sans cursor-pointer mt-2"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
