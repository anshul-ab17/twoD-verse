"use client"

import GridEditor from "@/components/space/GridEditor"

export default function EditorPage({
  params,
}: {
  params: { spaceId: string }
}) {
  return (
    <div className="text-white">

      <h1 className="text-2xl font-bold mb-6">
        Editing Space: {params.spaceId}
      </h1>

      <GridEditor width={20} height={15} />

    </div>
  )
}