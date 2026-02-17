import Link from "next/link"
import Hero3D from "./hero-3d"

interface HomeProps {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: HomeProps) {
  const href = isAuthenticated ? "/space" : "/signin"

  return (
    <div className="relative h-screen w-full overflow-hidden text-white">

      {/* Fullscreen 3D */}
      <Hero3D />

      {/* Smooth Gradient Fade (top + bottom) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black" />

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
          Create Your Verse
        </h2>

        <p className="mt-6 max-w-xl text-lg text-white/80">
          Build your digital space. Shape your ideas.
        </p>

        <Link
          href={href}
          className="mt-10 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          Start Now
        </Link>
      </div>
    </div>
  )
}
