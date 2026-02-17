"use client"

import Hero3D from "../home/hero-3d" // adjust path

interface SpaceLandingProps {
  userName: string
}

export default function Landing({ userName }: SpaceLandingProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      {/* Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-bold md:text-5xl">
          Hi, {userName}
        </h1>

        <p className="mt-6 max-w-xl text-white/70 text-lg">
          Your verse is empty.
          <br />
          Start shaping your world from here.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-lg bg-white px-6 py-3 text-black font-medium transition hover:scale-105">
            Create New Space
          </button>

          <button className="rounded-lg border border-white px-6 py-3 transition hover:bg-white hover:text-black">
            Explore Templates
          </button>
        </div>
      </div>

    </div>
  )
}
