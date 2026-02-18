"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Github } from "lucide-react"

import AuthCard from "./AuthCard"

export default function SigninForm() {
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState("")

  const handleSignIn = async (provider: string) => {
    if (!accepted) {
      setError("Please accept the Terms & Conditions to continue.")
      return
    }

    setError("")
    await signIn(provider, { callbackUrl: "/space/dashboard" })
  }

  return (
    <AuthCard>
      <h2 className="text-2xl font-semibold text-white mb-2">
        Welcome Back
      </h2>

      <p className="text-white/60 mb-10">
        Sign in to continue your journey
      </p>

      <div className="space-y-4">

        <Button
          variant="outline"
          disabled={!accepted}
          onClick={() => handleSignIn("google")}
          className="w-full flex items-center justify-center gap-3
                     border-white/25 bg-transparent
                     hover:bg-white/5 hover:border-white/40"
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <Button
          variant="outline"
          disabled={!accepted}
          onClick={() => handleSignIn("Github")}
          className="w-full flex items-center justify-center gap-3
                     border-white/25 bg-transparent
                     hover:bg-white/5 hover:border-white/40"
        >
          <Github className="h-5 w-5" />
          Continue with Github
        </Button>

      </div>

      <Separator className="my-10 bg-white/15" />

      <div className="flex items-start gap-3 text-sm text-white/60">
        <Checkbox
          checked={accepted}
          onCheckedChange={() => setAccepted(!accepted)}
          className="border-white/40 data-[state=checked]:bg-white"
        />
        <span>
          By signing in, you agree to our Terms & Conditions.
        </span>
      </div>

      {error && (
        <p className="mt-4 text-red-400 text-sm">
          {error}
        </p>
      )}
    </AuthCard>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.23 3.6l6.9-6.9C35.73 2.37 30.27 0 24 0 14.82 0 6.73 5.48 2.69 13.44l8.05 6.25C12.64 13.15 17.83 9.5 24 9.5z"/>
      <path fill="#34A853" d="M46.5 24.5c0-1.64-.15-3.2-.43-4.72H24v9h12.73c-.55 2.96-2.23 5.47-4.76 7.16l7.36 5.71C43.95 37.4 46.5 31.47 46.5 24.5z"/>
      <path fill="#4A90E2" d="M10.74 28.69a14.49 14.49 0 010-9.38L2.69 13.06a24 24 0 000 21.88l8.05-6.25z"/>
      <path fill="#FBBC05" d="M24 48c6.27 0 11.55-2.07 15.4-5.63l-7.36-5.71c-2.05 1.38-4.67 2.19-8.04 2.19-6.17 0-11.36-3.65-13.26-8.69l-8.05 6.25C6.73 42.52 14.82 48 24 48z"/>
    </svg>
  )
}