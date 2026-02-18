"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

export default function Player() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const keys = useRef<Record<string, boolean>>({})

  const { camera } = useThree()

  // Key listeners
  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true
    }

    const handleUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleDown)
    window.addEventListener("keyup", handleUp)

    return () => {
      window.removeEventListener("keydown", handleDown)
      window.removeEventListener("keyup", handleUp)
    }
  }, [])

  useFrame((_, delta) => {
    const acceleration = 3        // lower = slower
    const damping = 0.90          // higher = smoother glide
    const maxSpeed = 3            // caps top speed

    direction.current.set(0, 0, 0)

    // WASD
    if (keys.current["w"]) direction.current.y += 1
    if (keys.current["s"]) direction.current.y -= 1
    if (keys.current["a"]) direction.current.x -= 1
    if (keys.current["d"]) direction.current.x += 1

    // Arrow keys
    if (keys.current["arrowup"]) direction.current.y += 1
    if (keys.current["arrowdown"]) direction.current.y -= 1
    if (keys.current["arrowleft"]) direction.current.x -= 1
    if (keys.current["arrowright"]) direction.current.x += 1

    // Normalize diagonal movement
    if (direction.current.length() > 0) {
      direction.current.normalize()
    }

    // Apply acceleration
    velocity.current.x += direction.current.x * acceleration * delta
    velocity.current.y += direction.current.y * acceleration * delta

    // Clamp max speed
    velocity.current.clampLength(0, maxSpeed)

    // Apply damping (smooth slowdown)
    velocity.current.multiplyScalar(damping)

    // Apply movement
    meshRef.current.position.x += velocity.current.x
    meshRef.current.position.y += velocity.current.y

    // Boundaries
    meshRef.current.position.x = THREE.MathUtils.clamp(
      meshRef.current.position.x,
      -50,
      50
    )

    meshRef.current.position.y = THREE.MathUtils.clamp(
      meshRef.current.position.y,
      -50,
      50
    )

    // Smooth camera follow
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      meshRef.current.position.x,
      0.08
    )

    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      meshRef.current.position.y,
      0.08
    )
  })

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[0.6, 32]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  )
}
