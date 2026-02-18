"use client"

import Hero3D from "@/components/home/hero-3d"
import { ReactNode } from "react"

interface AuthCardProps {
  children: ReactNode
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="relative min-h-screen w-full  text-white">

      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <Hero3D />
      </div>

      <div className="absolute inset-0 -z-10 bg-black/70" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">

        <div
          className="relative grid w-full max-w-4xl min-h-125
                     overflow-hidden rounded-2xl
                     border border-white/20
                     bg-[#070707]
                     shadow-[0_60px_160px_rgba(0,0,0,0.98)]
                     md:grid-cols-2"
        >
 
          <div className="pointer-events-none absolute inset-0
                          bg-linear-to-br from-white/3 via-transparent to-transparent" />
 
          <div className="relative flex flex-col justify-between px-14 py-16
                          bg-linear-to-br from-[#111111] via-[#070707] to-[#070707]">

            <div className="absolute top-0 right-0 h-full w-px
                            bg-linear-to-b from-transparent via-white/15 to-transparent" />

            <div>
              <h2 className="text-sm tracking-[0.5em] text-white/50 mb-10">
                TWOD VERSE
              </h2>

              <h1 className="text-4xl font-semibold leading-tight tracking-tight
                             bg-linear-to-b from-white to-white/70
                             bg-clip-text text-transparent">
                Meet Your Cosmos.
              </h1>

              <p className="mt-8 text-white/75 text-lg leading-relaxed max-w-sm">
                Build immersive digital realms.
                <br />
                Shape your universe.
                <br />
                No limits required.
              </p>
            </div>

            <p className="text-sm text-white/40">
              Powered by imagination.
            </p>
          </div>
 
          <div className="flex flex-col justify-center px-14 py-16 bg-[#0e0e0e]">
            {children}
          </div>

        </div>

      </div>
    </div>
  )
}
