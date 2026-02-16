"use client"

import { signIn } from "./actions"

export default function SigninForm() {
  return (
    <form
      action={signIn}
      className="flex w-80 flex-col gap-4 rounded-xl border p-6"
    >
      <h2 className="text-2xl font-semibold">Sign In</h2>

      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded border px-3 py-2"
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="rounded border px-3 py-2"
        required
      />

      <button
        type="submit"
        className="rounded bg-black py-2 text-white"
      >
        Sign In
      </button>
    </form>
  )
}
