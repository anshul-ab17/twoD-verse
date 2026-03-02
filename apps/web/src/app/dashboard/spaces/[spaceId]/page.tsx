"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function SpacePage() {
  const params = useParams()
  const spaceId =
    typeof params.spaceId === "string"
      ? params.spaceId
      : params.spaceId?.[0]

  const [space, setSpace] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const userRaw = localStorage.getItem("currentUser")
      const spacesRaw = localStorage.getItem("spaces")

      if (!userRaw) {
        console.log("No currentUser found")
        setLoading(false)
        return
      }

      const user = JSON.parse(userRaw)
      setCurrentUser(user)

      const spaces = spacesRaw ? JSON.parse(spacesRaw) : []

      const found = spaces.find(
        (s: any) => s.id === spaceId
      )

      if (!found) {
        console.log("Space not found")
        setLoading(false)
        return
      }

      const memberCheck = found.members?.some(
        (m: any) => m.id === user.id
      )

      setIsMember(memberCheck)
      setSpace(found)
      setLoading(false)
    } catch (err) {
      console.error("Space load error:", err)
      setLoading(false)
    }
  }, [spaceId])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  if (!space) {
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        Space not found
      </div>
    )
  }

  const joinSpace = () => {
    if (isMember) return

    const spaces =
      JSON.parse(localStorage.getItem("spaces") || "[]")

    const updated = spaces.map((s: any) => {
      if (s.id === spaceId) {
        return {
          ...s,
          members: [...(s.members || []), currentUser],
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
    <div className="h-screen flex items-center justify-center bg-[#1e293b] text-white">

      {!isMember ? (
        <div className="bg-[#8B5A2B] p-10 rounded-2xl text-center">

          <h1 className="text-2xl font-bold mb-6">
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
        <div className="w-full h-full flex items-center justify-center">
          2D Office Placeholder
        </div>
      )}

    </div>
  )
}