"use client"
import { useState } from "react"
import Link from "next/link"

export default function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Sign Up:", { email, password })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-80 flex-col gap-4 rounded-lg border p-6"
    >
      <h2 className="text-2xl font-semibold">Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        className="rounded border px-3 py-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="rounded border px-3 py-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        type="submit"
        className="rounded bg-black py-2 text-white"
      >
        Sign Up
      </button>

      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/signin" className="underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
