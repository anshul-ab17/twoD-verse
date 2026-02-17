"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState } from "react"
import * as THREE from "three"

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null!)
  const positionsRef = useRef<Float32Array | null>(null)


  const geometry = useMemo(() => {
    const count = 6000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const blueVioletPalette = [
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a78bfa",
      "#4f46e5"
    ]

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 70
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100

      const isColored = Math.random() < 0.4

      const color = new THREE.Color(
        isColored
          ? blueVioletPalette[Math.floor(Math.random() * blueVioletPalette.length)]
          : "#ffffff"
      )

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    positionsRef.current = positions

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    return geometry
  }, [])

  useFrame(() => {
    if (!ref.current || !positionsRef.current) return

    const positions = positionsRef.current

    // Subtle forward flow
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += 0.05

      // Reset star if too close
      if (positions[i + 2] > 50) {
        positions[i + 2] = -50
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true

    // Gentle ambient rotation
    ref.current.rotation.y += 0.0008
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        depthWrite={false}
      />
    </points>
  )
}

function Controls() {
  const { camera } = useThree()
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))
    const up = (e: KeyboardEvent) =>
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))

    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)

    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
    }
  }, [])

  useFrame(({ pointer }) => {
    // Smooth mouse tilt
    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      -pointer.x * 0.18,
      0.03
    )

    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      -pointer.y * 0.12,
      0.03
    )

    // Slow controlled movement
    const speed = 0.07
    const limitX = 10
    const minZ = 8
    const maxZ = 25

    if ((keys["w"] || keys["arrowup"]) && camera.position.z > minZ)
      camera.position.z -= speed

    if ((keys["s"] || keys["arrowdown"]) && camera.position.z < maxZ)
      camera.position.z += speed

    if ((keys["a"] || keys["arrowleft"]) && camera.position.x > -limitX)
      camera.position.x -= speed

    if ((keys["d"] || keys["arrowright"]) && camera.position.x < limitX)
      camera.position.x += speed
  })

  return null
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 50 }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 40, 150]} />
      <ambientLight intensity={0.9} />

      <Controls />
      <FloatingParticles />
    </Canvas>
  )
}
