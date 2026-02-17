import Link from "next/link"
import Hero3D from "./hero-3d"

interface HomeProps {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: HomeProps) {
  const href = isAuthenticated ? "/space" : "/signin"

  return (
    <div className="relative h-screen w-full overflow-hidden text-white">

      <Hero3D />

      {/* Soft glow aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(140,80,255,0.2),transparent_60%)]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Enter the World
        </h1>

        <p className="mt-6 max-w-xl text-lg text-white/70">
          Build playful spaces. Explore ideas.
          Shape mysterious digital realms.
        </p>

        <Link
          href={href}
          className="mt-10 rounded-md bg-white px-6 py-3 text-sm font-semibold text-black transition hover:scale-105"
        >
          Start Exploring
        </Link>
      </div>
    </div>
  )
}
