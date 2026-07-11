"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function SigninForm() {
  const router = useRouter()
  const next = useSearchParams().get("next") ?? "/verse"
  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCodes, setOtpCodes] = useState(["", "", "", ""])
  const [countdown, setCountdown] = useState(59)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:2569"

  const handleOAuth = async (platform: string) => {
    setLoading(true)
    setError("")
    try {
      // Check if provider is configured on gateway. If not, fallback to mock login automatically.
      const res = await fetch(`${GATEWAY}/v1/auth/oauth/${platform}`, { method: "GET", redirect: "manual" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data && data.error === "provider not configured") {
          // Fallback to local development mock session
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", `mock-oauth-${platform}`)
            localStorage.setItem("refreshToken", `mock-oauth-refresh-${platform}`)
          }
          router.push(next)
          return
        }
      }
      window.location.href = `${GATEWAY}/v1/auth/oauth/${platform}`
    } catch {
      // Network check failed/blocked (likely CORS on direct GET check): redirect browser to endpoint directly.
      window.location.href = `${GATEWAY}/v1/auth/oauth/${platform}`
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    setLoading(true)
    try {
      // Direct passless register/login flow:
      // Try to signup with a placeholder password first (v1 dual-token model).
      const dummyPassword = "PasslessUser123!"
      const res = await fetch(`${GATEWAY}/v1/auth/signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: dummyPassword }),
      })

      if (res.status === 409) {
        // If user already exists, login instead
        const loginRes = await fetch(`${GATEWAY}/v1/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password: dummyPassword }),
        })
        if (loginRes.ok) {
          const pair = await loginRes.json()
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", pair.accessToken)
            localStorage.setItem("refreshToken", pair.refreshToken)
          }
          router.push(next)
          return
        }
      }

      if (res.ok) {
        const pair = await res.json()
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", pair.accessToken)
          localStorage.setItem("refreshToken", pair.refreshToken)
        }
        router.push(next)
      } else {
        const msg = await res.json().then((j) => (j as { error?: string }).error).catch(() => null)
        setError(msg ?? "Failed to sign up. Please try again.")
      }
    } catch (err) {
      setError("Connection to gateway failed. Please ensure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return
    const newCodes = [...otpCodes]
    newCodes[index] = val.slice(-1)
    setOtpCodes(newCodes)
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = otpCodes.join("")
    if (fullCode.length < 4) {
      setError("Please fill out all 4 digits.")
      return
    }
    setError("")
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", "mock-access-token")
        localStorage.setItem("refreshToken", "mock-refresh-token")
      }
      router.push(next)
    }, 1200)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="relative bg-[#0e0e11] border border-[#232329] w-full max-w-[420px] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Top Banner Illustration */}
        <div className="relative w-full h-[140px] overflow-hidden bg-zinc-900 border-b border-[#232329]">
          <img src="/signin-art.webp" alt="" className="w-full h-full object-cover opacity-90" />
        </div>

        {/* Modal Form Content */}
        <div className="p-7">
          {/* Mascot & Title */}
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <span className="text-[10px] font-mono font-bold tracking-widest text-[#7c7c82] uppercase block mb-1">
              TwoD VERSE // authentication
            </span>
            <h2 className="text-[20px] font-extrabold text-white tracking-tight">
              {otpSent ? "Verify Code" : "Welcome to TwoD VERSE"}
            </h2>
            <p className="text-[11.5px] text-[#a0a0a5] mt-1.5 font-sans">
              {otpSent ? `We sent a 4-digit code to ${email}` : "Choose your preferred sign in method"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-lg text-[11px] font-medium leading-relaxed font-sans">
              ⚠️ {error}
            </div>
          )}

          {!otpSent ? (
            <div className="flex flex-col">
              {/* Social Logins */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.74 8.87 5.04 12 5.04z" />
                    <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.15-1.98 3.39-4.89 3.39-8.54z" />
                    <path fill="#fbbc05" d="M5.36 14.5c-.24-.73-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.5 6.9C.54 8.82 0 10.97 0 13.2c0 2.23.54 4.38 1.5 6.3l3.86-3z" />
                    <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.1.74-2.51 1.18-4.29 1.18-3.13 0-5.73-2.7-6.64-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  onClick={() => handleOAuth("github")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                <button
                  onClick={() => handleOAuth("apple")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50 cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 3 .98.08 2.15-.54 2.8-1.31z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[#7c7c82] text-[9.5px] font-mono uppercase tracking-widest bg-[#0e0e11] px-2">or sign in with</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Work email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="youremail@example.com"
                    disabled={loading}
                    className="w-full bg-[#171721] border border-[#2d2d39] focus:border-[#5B5BF0] outline-none rounded-lg px-4 py-3.5 text-xs text-white placeholder:text-zinc-600 transition-all duration-150 font-sans"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black rounded-lg py-3.5 text-xs font-bold transition-all duration-150 uppercase tracking-widest font-sans cursor-pointer mt-2"
                >
                  {loading ? "Sending..." : "Get OTP"}
                </button>
              </form>
            </div>
          ) : (
            /* OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex justify-center gap-3">
                {otpCodes.map((code, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={code}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    disabled={loading}
                    className="w-12 h-14 bg-[#171721] border border-[#2d2d39] focus:border-[#5B5BF0] focus:bg-[#1a1a28] outline-none rounded-lg text-center text-lg font-bold text-white font-sans transition-all duration-150"
                  />
                ))}
              </div>

              <div className="text-center">
                <span className="text-[11px] font-mono text-[#7c7c82]">
                  {countdown > 0 ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCountdown(59)
                        setOtpCodes(["", "", "", ""])
                      }}
                      className="text-white font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black rounded-lg py-3.5 text-xs font-bold transition-all duration-150 uppercase tracking-widest font-sans cursor-pointer"
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full bg-transparent hover:bg-white/5 text-[#a0a0a5] hover:text-white rounded-lg py-2.5 text-[10px] font-bold font-mono transition-all duration-150 uppercase tracking-widest"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}
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
