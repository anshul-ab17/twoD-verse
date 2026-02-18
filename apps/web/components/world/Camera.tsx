"use client"

import { useThree, useFrame } from "@react-three/fiber"
import { useWorldStore } from "@/store/useWorldStore"

export default function CameraController() {
  const { camera } = useThree()
  const { position } = useWorldStore()

  useFrame(() => {
    const lerp = 0.08

    camera.position.x += (position.x - camera.position.x) * lerp
    camera.position.y += (position.y - camera.position.y) * lerp
  })

  return null
}
