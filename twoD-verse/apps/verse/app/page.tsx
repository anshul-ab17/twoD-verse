import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6  bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold">TwoD verse</h1>

      <div className="flex gap-4">
        <Link
          href="/signin"
          className="rounded-md bg-black px-4 py-2 text-white"
        >
          Sign In
        </Link>

        <Link
          href="/signup"
          className="rounded-md border border-black px-4 py-2"
        >
          Sign Up
        </Link>
      </div>
    </div>
  )
}
