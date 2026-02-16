import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface HomeProps {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: HomeProps) {
  const href = isAuthenticated ? "/verse" : "/signin"

  return (
    <div className="relative flex min-h-screen flex-col text-white overflow-hidden">

      {/* Background Image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 -z-10 bg-black/60" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-8 py-6">
        <h1 className="text-xl font-semibold tracking-widest">
          Twodverse
        </h1>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href={isAuthenticated ? "/api/auth/signout" : "/signin"}
            className="text-sm font-medium hover:underline"
          >
            {isAuthenticated ? "Logout" : "Sign In"}
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Create Your Verse
        </h2>

        <p className="mt-6 max-w-xl text-lg text-white/80">
          Build your digital space. Shape your ideas.
        </p>

        <Link
          href={href}
          className="mt-8 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Start Now
        </Link>
      </div>
    </div>
  )
}
