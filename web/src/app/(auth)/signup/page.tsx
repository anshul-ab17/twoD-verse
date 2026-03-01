"use client"

import Hero from "@/components/home/Hero"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <Hero
      overlay="bg-black/50"
      blur="backdrop-blur-xl"
    >
      <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-10 rounded-3xl shadow-2xl w-[420px] text-white">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Create Account
        </h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E59E2D]"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#E59E2D]"
          />

          <button className="w-full bg-[#E59E2D] hover:bg-[#cc8c26] text-white p-3 rounded-lg transition">
            Sign Up
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-white/70">
          Already have an account?{" "}
          <Link href="/signin" className="underline text-[#E59E2D]">
            Sign in
          </Link>
        </div>

      </div>
    </Hero>
  )
}