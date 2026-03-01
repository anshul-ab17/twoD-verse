"use client"

import { useParams, useRouter } from "next/navigation"
import Hero from "@/components/home/Hero"

export default function InvitePage() {
  const { spaceId } = useParams()
  const router = useRouter()

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/spaces/${spaceId}`
      : ""

  return (
    <Hero overlay="bg-black/40" blur="backdrop-blur-md">

      <div className="max-w-2xl w-full text-white text-center">

        <div className="bg-[#8B5A2B] p-10 rounded-2xl border border-[#5A3B1C] shadow-2xl">

          <h1 className="text-2xl font-bold text-yellow-200 mb-4">
            Invite your team
          </h1>

          <p className="mb-6 text-white/80">
            Share this link to bring collaborators into your space.
          </p>

          <div className="flex gap-2 mb-6">
            <input
              readOnly
              value={shareLink}
              className="flex-1 p-3 rounded-lg text-black"
            />

            <button
              onClick={() =>
                navigator.clipboard.writeText(shareLink)
              }
              className="px-6 bg-[#556B2F] hover:bg-[#6B8E23]
                         rounded-lg"
            >
              Copy
            </button>
          </div>

          <button
            onClick={() =>
              router.push(
                `/dashboard/spaces/${spaceId}`
              )
            }
            className="px-8 py-3 bg-[#556B2F]
                       hover:bg-[#6B8E23]
                       rounded-xl text-lg"
          >
            Continue
          </button>

        </div>

      </div>

    </Hero>
  )
}