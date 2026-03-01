"use client"

const TILE = 32

export default function GridEditor({
  width,
  height,
  elements = [],
}: {
  width: number
  height: number
  elements?: any[]
}) {
  return (
    <div
      className="relative bg-[#2d3748] border border-gray-600"
      style={{
        width: width * TILE,
        height: height * TILE,
      }}
    >
      {/* Grid */}
      {Array.from({ length: width * height }).map((_, i) => {
        const x = i % width
        const y = Math.floor(i / width)

        return (
          <div
            key={i}
            className="absolute border border-gray-700"
            style={{
              width: TILE,
              height: TILE,
              left: x * TILE,
              top: y * TILE,
            }}
          />
        )
      })}

      {/* Elements (safe) */}
      {elements?.map((el: any) => (
        <div
          key={el.id}
          className="absolute bg-blue-400"
          style={{
            width: el.width * TILE,
            height: el.height * TILE,
            left: el.x * TILE,
            top: el.y * TILE,
          }}
        />
      ))}
    </div>
  )
}