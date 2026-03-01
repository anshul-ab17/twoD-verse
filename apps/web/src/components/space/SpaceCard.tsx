import Link from "next/link"

export default function SpaceCard({ space }: any) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="font-semibold mb-2">
        {space.name}
      </h2>

      <p className="text-sm text-gray-500">
        {space.width} × {space.height}
      </p>

      <Link
        href={`/dashboard/spaces/${space.id}/editor`}
        className="text-blue-600 mt-2 inline-block"
      >
        Enter
      </Link>
    </div>
  )
}