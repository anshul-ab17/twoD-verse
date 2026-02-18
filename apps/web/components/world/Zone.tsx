"use client"
import { useWorldStore } from "@/store/useWorldStore"

const zones = [
  { id: "meeting", x: 5, y: 5, width: 6, height: 6 },
  { id: "project", x: -8, y: 4, width: 6, height: 6 },
  { id: "social", x: 0, y: -8, width: 6, height: 6 },
]

export default function Zones() {
  return (
    <>
      {zones.map((zone) => (
        <mesh
          key={zone.id}
          position={[zone.x, zone.y, -0.1]}
        >
          <planeGeometry args={[zone.width, zone.height]} />
          <meshBasicMaterial color="#16a34a" transparent opacity={0.2} />
        </mesh>
      ))}
    </>
  )
}
