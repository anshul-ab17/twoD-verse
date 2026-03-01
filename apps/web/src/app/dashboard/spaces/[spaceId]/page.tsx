"use client"

import Link from "next/link"

export default function SpacePage({
  params,
}: {
  params: { spaceId: string }
}) {
  return (
    <div className="text-white max-w-4xl">

      <h1 className="text-3xl font-bold mb-6">
        Space ID: {params.spaceId}
      </h1>

      <Link
        href={`/dashboard/spaces/${params.spaceId}/editor`}
        className="px-6 py-3 bg-[#556B2F] rounded-lg"
      >
        Enter Editor
      </Link>

    </div>
  )
}