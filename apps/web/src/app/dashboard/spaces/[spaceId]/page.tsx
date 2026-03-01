"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Hero from "@/components/home/Hero"

export default function SpacePage() {
  const { spaceId } = useParams()

  const [space, setSpace] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("currentUser")!
    )
    setCurrentUser(user)

    const spaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const found = spaces.find(
      (s: any) => s.id === spaceId
    )

    if (!found) return

    const memberCheck = found.members.some(
      (m: any) => m.id === user.id
    )

    setIsMember(memberCheck)
    setSpace(found)
  }, [spaceId])

  if (!space || !currentUser) return null

  const joinSpace = () => {
    if (isMember) return

    const spaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const updated = spaces.map((s: any) => {
      if (s.id === spaceId) {
        // prevent duplicate join
        const alreadyMember = s.members.some(
          (m: any) => m.id === currentUser.id
        )

        if (alreadyMember) return s

        return {
          ...s,
          members: [...s.members, currentUser],
        }
      }
      return s
    })

    localStorage.setItem(
      "spaces",
      JSON.stringify(updated)
    )

    setIsMember(true)
    setSpace(updated.find((s: any) => s.id === spaceId))
  }

  return (
    <Hero overlay="bg-black/20" blur="backdrop-blur-sm">

      <div className="w-full max-w-6xl">

        {!isMember ? (
          <div className="bg-[#8B5A2B] p-10 rounded-2xl border border-[#5A3B1C] shadow-xl text-white text-center">

            <h1 className="text-2xl font-bold text-yellow-200 mb-6">
              {space.name}
            </h1>

            <p className="mb-6 text-white/80">
              You are not a member of this space.
            </p>

            <button
              onClick={joinSpace}
              className="px-8 py-3 bg-[#556B2F]
                         hover:bg-[#6B8E23]
                         rounded-xl"
            >
              Join Space
            </button>

          </div>
        ) : (
          <div className="w-full h-[650px] bg-[#2d3748]
                          rounded-2xl border border-gray-600
                          shadow-2xl relative overflow-hidden">

            {/* 2D Office Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center text-white/50 text-xl">
              2D Office for {space.name}
            </div>

          </div>
        )}

      </div>

    </Hero>
  )
}