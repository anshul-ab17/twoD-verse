"use client"

import Hero from "@/components/home/Hero"
import Link from "next/link"

const mockSpaces = [
  { id: "1", name: "Creative Hub", members: 5 },
  { id: "2", name: "Team Room", members: 3 },
  { id: "3", name: "Gaming Lounge", members: 8 },
]

export default function Dashboard() {
  return (
    <Hero overlay="bg-black/20" blur="backdrop-blur-md">

      <div className="w-full max-w-6xl text-white px-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-12">

          {/* Wooden Board */}
          <div className="relative bg-[#8B5A2B] px-8 py-4 rounded-xl
                          border border-[#5A3B1C]
                          shadow-xl overflow-hidden">

            <div className="absolute inset-0 opacity-15 mix-blend-overlay
                            bg-[repeating-linear-gradient(45deg,#00000020_0px,#00000020_2px,transparent_2px,transparent_6px)]" />

            <h1 className="relative text-2xl font-bold text-yellow-200">
              Your Spaces
            </h1>
          </div>

          {/* Olive Create Button */}
          <Link
            href="/dashboard/spaces/create"
            className="px-6 py-3
                       bg-[#556B2F] hover:bg-[#6B8E23]
                       text-white font-semibold rounded-xl
                       border border-[#3E4F1F]
                       shadow-lg hover:shadow-2xl
                       hover:-translate-y-1
                       transition-all duration-200"
          >
            + Create Space
          </Link>

        </div>

        {/* Wooden Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {mockSpaces.map((space) => (
            <Link
              key={space.id}
              href={`/dashboard/spaces/${space.id}`}
              className="relative bg-[#8B5A2B]
                         border border-[#5A3B1C]
                         rounded-2xl p-8
                         shadow-xl
                         hover:-translate-y-1
                         hover:shadow-2xl
                         transition-all duration-200
                         overflow-hidden"
            >
              {/* Wood Texture Overlay */}
              <div className="absolute inset-0 opacity-10 mix-blend-overlay
                              bg-[repeating-linear-gradient(45deg,#00000020_0px,#00000020_2px,transparent_2px,transparent_6px)]" />

              <h2 className="relative text-xl font-semibold text-yellow-200 mb-3">
                {space.name}
              </h2>

              <p className="relative text-sm text-white/80">
                {space.members} members inside
              </p>

            </Link>
          ))}

        </div>

      </div>

    </Hero>
  )
}