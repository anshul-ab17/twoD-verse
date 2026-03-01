"use client"

import Hero from "@/components/home/Hero"
import Link from "next/link"

export default function SignUpPage() {
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
            Create Account
          </h2>

          <div className="space-y-4">

            <button className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition">
              🔴 Continue with Google
            </button>

            <button className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 rounded-lg border border-white/20 hover:bg-gray-900 transition">
              🐙 Continue with GitHub
            </button>

            <div className="text-center text-sm text-white/60 my-4">
              or
            </div>

            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-black/40 border border-white/20"
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-black/40 border border-white/20"
            />

            <button className="w-full bg-[#E59E2D] hover:bg-[#cc8c26] text-white p-3 rounded-lg font-semibold transition">
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

      </div>

    </Hero>
  )
}