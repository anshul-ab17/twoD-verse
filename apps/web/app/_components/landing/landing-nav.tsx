"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Custom minimalist spatial coordinate logo for twoD-verse
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

// Complete mock Auth modal with Google, Github and simulated OTP transition screen
interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpCodes, setOtpCodes] = useState(["", "", "", ""])
  const [countdown, setCountdown] = useState(59)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Reset states on close
  useEffect(() => {
    if (!isOpen) {
      setEmail("")
      setOtpSent(false)
      setOtpCodes(["", "", "", ""])
      setError("")
      setLoading(false)
    }
  }, [isOpen])

  // Count down timer for OTP screen
  useEffect(() => {
    if (!otpSent || countdown <= 0) return
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpSent, countdown])

  if (!isOpen) return null

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setOtpSent(true)
      setCountdown(59)
    }, 1000)
  }

  const handleOtpChange = (val: string, index: number) => {
    if (!/^\d*$/.test(val)) return // Only allow digits
    const newCodes = [...otpCodes]
    newCodes[index] = val.slice(-1) // Take the last digit
    setOtpCodes(newCodes)

    // Autofocus next input
    if (val && index < 3) {
      otpRefs[index + 1]?.current?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpCodes[index] && index > 0) {
      const newCodes = [...otpCodes]
      newCodes[index - 1] = ""
      setOtpCodes(newCodes)
      otpRefs[index - 1]?.current?.focus()
    }
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
      // Save simulated token and redirect
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", "mock-access-token")
        localStorage.setItem("refreshToken", "mock-refresh-token")
      }
      onClose()
      router.push("/verse")
    }, 1200)
  }

  const handleMockOAuth = (platform: string) => {
    setLoading(true)
    setError("")
    setTimeout(() => {
      setLoading(false)
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", `mock-oauth-${platform}`)
        localStorage.setItem("refreshToken", `mock-oauth-refresh-${platform}`)
      }
      onClose()
      router.push("/verse")
    }, 1000)
  }

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 transition-opacity duration-300"
      style={{ backdropFilter: "blur(2.5px)" }}
    >
      <div className="relative bg-[#0e0e11] border border-[#232329] w-full max-w-[420px] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300">
        
        {/* Top Banner Illustration with Close Button */}
        <div className="relative w-full h-[140px] overflow-hidden bg-zinc-900 border-b border-[#232329]">
          <img src="/signin-art.webp" alt="" className="w-full h-full object-cover opacity-90" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 h-7 w-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-xs font-bold text-white border border-white/10 cursor-pointer transition-colors duration-150 outline-none"
          >
            ✕
          </button>
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
            <p className="text-[11.5px] text-[#a0a0a5] mt-1.5">
              {otpSent ? `We sent a 4-digit code to ${email}` : "Choose your preferred sign in method"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-lg text-[11px] font-medium leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {!otpSent ? (
            /* OAuth and Email Input Section */
            <div className="flex flex-col">
              
              {/* Social Logins: 3-column row */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleMockOAuth("google")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50"
                >
                  {/* Google Icon */}
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path fill="#ea4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3C6.27 7.74 8.87 5.04 12 5.04z" />
                    <path fill="#4285f4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.67 2.84c2.15-1.98 3.39-4.89 3.39-8.54z" />
                    <path fill="#fbbc05" d="M5.36 14.5c-.24-.73-.38-1.5-.38-2.3c0-.8.14-1.57.38-2.3L1.5 6.9C.54 8.82 0 10.97 0 13.2c0 2.23.54 4.38 1.5 6.3l3.86-3z" />
                    <path fill="#34a853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.67-2.84c-1.1.74-2.51 1.18-4.29 1.18-3.13 0-5.73-2.7-6.64-5.46l-3.86 3C3.4 20.35 7.35 23 12 23z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  onClick={() => handleMockOAuth("github")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50"
                >
                  {/* GitHub Icon */}
                  <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span>GitHub</span>
                </button>

                <button
                  onClick={() => handleMockOAuth("apple")}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 border border-[#2d2d39] bg-[#171721] hover:bg-[#252535] hover:border-zinc-500 rounded-lg py-3 text-[11px] font-bold text-white transition-all duration-150 font-sans disabled:opacity-50"
                >
                  {/* Apple Icon */}
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
            /* OTP Entry Form */
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex justify-center gap-3">
                {otpCodes.map((code, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    maxLength={1}
                    value={code}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
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
    </div>
  )
}

export function LandingNav({ phase = "done" }: { phase?: "loading" | "exit" | "done" }) {
  const [scrolled, setScrolled] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])

  // Check login state
  useEffect(() => {
    const checkLogin = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken")
        setIsLoggedIn(!!token)
      }
    }
    checkLogin()
    // Listen for storage changes in the same page
    const interval = setInterval(checkLogin, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      setIsLoggedIn(false)
    }
  }

  return (
    <>
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
          style={{
            padding: "22px 4.5vw",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          
          {/* Logo Brand (TwoD VERSE) */}
          <Link href="/" className="flex items-center" style={{ opacity: phase === "done" ? 1 : 0 }}>
            <span style={{ fontFamily: "'Anybody', sans-serif", fontWeight: 900, fontStretch: "140%", fontSize: "19px", letterSpacing: "-0.02em", color: "#111111" }}>
              TwoD VERSE
            </span>
          </Link>
          
          {/* Nocturn Reference centered navigation text links */}
          <div className="hidden md:flex items-center gap-8 text-[12px] font-sans font-bold text-[#111111] uppercase tracking-wider">
            <a href="/#features" className="hover:text-black/60 transition-colors duration-150">Product</a>
            <Link href="/themes" className="hover:text-black/60 transition-colors duration-150">Themes</Link>
            <a href="/#how" className="hover:text-black/60 transition-colors duration-150">Spaces</a>
            <a href="/#services" className="hover:text-black/60 transition-colors duration-150">Pricing</a>
            <a href="#" className="hover:text-black/60 transition-colors duration-150">Journal</a>
          </div>

          {/* Action pill buttons */}
          <div className="flex items-center gap-3" style={{ opacity: phase === "done" ? 1 : 0 }}>
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLogout}
                  className="text-[11px] font-mono uppercase tracking-wider text-black/60 hover:text-black transition-all duration-150 cursor-pointer"
                >
                  Log Out
                </button>
                <Link
                  href="/verse"
                  className="rounded-[100px] bg-[#111111] hover:bg-[#333333] text-white px-6 py-2.5 text-[11px] font-bold font-sans uppercase tracking-wider transition-all duration-150"
                >
                  Go to Space
                </Link>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="rounded-[100px] bg-[#111111] hover:bg-[#333333] text-white text-[11px] font-bold font-sans uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center"
                style={{
                  width: "116px",
                  height: "39px",
                  borderRadius: "999px",
                  fontFamily: "'Space Grotesk', sans-serif"
                }}
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal Modal dialog box */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
