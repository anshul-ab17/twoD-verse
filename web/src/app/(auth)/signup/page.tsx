"use client"

import { useRouter } from "next/navigation"
import Hero from "@/components/home/Hero"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { useState } from "react"

export default function SignIn() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)

    // TODO: Replace with real API call
    setTimeout(() => {
      localStorage.setItem("token", "demo-token")
      router.push("/dashboard")
    }, 800)
  }

  return (
    <Hero blur="backdrop-blur-lg">
      <Card className="w-[420px]">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Sign In
        </h2>

        <div className="space-y-4">
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />

          <Button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-white/70">
          Don’t have an account?{" "}
          <Link
            href="/signup"
            className="text-white underline hover:text-white/90"
          >
            Sign up
          </Link>
        </div>
      </Card>
    </Hero>
  )
}