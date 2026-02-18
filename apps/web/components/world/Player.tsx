"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useWorldStore } from "@/store/useWorldStore"

type Props = {
  userName?: string
}

export default function Player({ userName }: Props) {
  const ref = useRef<THREE.Mesh>(null!)
  const velocity = useRef({ x: 0, y: 0 })
  const keys = useRef<{ [key: string]: boolean }>({})

  const { position, setPosition } = useWorldStore()

  // Key listeners
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true)
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false)

    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)

    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useFrame(() => {
    const speed = 0.08
    const damping = 0.85

    if (keys.current["w"]) velocity.current.y += speed
    if (keys.current["s"]) velocity.current.y -= speed
    if (keys.current["a"]) velocity.current.x -= speed
    if (keys.current["d"]) velocity.current.x += speed

    velocity.current.x *= damping
    velocity.current.y *= damping

    const newX = position.x + velocity.current.x
    const newY = position.y + velocity.current.y

    setPosition(newX, newY)

    if (ref.current) {
      ref.current.position.set(newX, newY, 0)
    }
  })

  return (
    <mesh ref={ref}>
      <circleGeometry args={[0.5, 32]} />
      <meshBasicMaterial color="#4f46e5" />
    </mesh>
  )
}
