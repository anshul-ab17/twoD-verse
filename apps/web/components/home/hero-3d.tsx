"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useEffect, useState } from "react"
import * as THREE from "three"

function StarLayer({
  count,
  size,
  speedMultiplier,
}: {
  count: number
  size: number
  speedMultiplier: number
}) {
  const ref = useRef<THREE.Points>(null!)
  const positionsRef = useRef<Float32Array | null>(null)

  const geometry = useMemo(() => {
    const range = 600
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * range
      positions[i * 3 + 1] = (Math.random() - 0.5) * range
      positions[i * 3 + 2] = (Math.random() - 0.5) * range

      if (Math.random() < 0.3) {
        const hue = THREE.MathUtils.lerp(220, 270, Math.random()) / 360
        const color = new THREE.Color().setHSL(hue, 0.9, 0.65)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      } else {
        colors[i * 3] = 1
        colors[i * 3 + 1] = 1
        colors[i * 3 + 2] = 1
      }
    }

    positionsRef.current = positions

    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    return geo
  }, [count])

  useFrame(({ camera }, delta) => {
    if (!ref.current || !positionsRef.current) return

    const positions = positionsRef.current
    const range = 600

    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 2] += delta * 30 * speedMultiplier

      let dx = positions[i] - camera.position.x
      let dy = positions[i + 1] - camera.position.y
      let dz = positions[i + 2] - camera.position.z

      if (dx > range / 2) positions[i] -= range
      if (dx < -range / 2) positions[i] += range

      if (dy > range / 2) positions[i + 1] -= range
      if (dy < -range / 2) positions[i + 1] += range

      if (dz > range / 2) positions[i + 2] -= range
      if (dz < -range / 2) positions[i + 2] += range
    }

    ref.current.rotation.y += delta * 0.01 * speedMultiplier
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}


function Controls() {
  const { camera } = useThree()
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({})
  const mouse = useRef({ x: 0, y: 0 })
  const warp = useRef(1)

  useEffect(() => {
    const down = (e: KeyboardEvent) =>
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: true }))
    const up = (e: KeyboardEvent) =>
      setKeys((prev) => ({ ...prev, [e.key.toLowerCase()]: false }))
    const move = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("mousemove", move)

    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("mousemove", move)
    }
  }, [])

  useFrame((_, delta) => {
    const targetWarp = keys["shift"] ? 5 : 1
    warp.current = THREE.MathUtils.lerp(warp.current, targetWarp, 0.08)

    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      -mouse.current.x * 0.6,
      0.07
    )

    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      mouse.current.y * 0.4,
      0.07
    )

    camera.translateZ(-delta * 6 * warp.current)

    if (keys["w"] || keys["arrowup"])
      camera.translateZ(-delta * 12 * warp.current)

    if (keys["s"] || keys["arrowdown"])
      camera.translateZ(delta * 12 * warp.current)

    if (keys["a"] || keys["arrowleft"])
      camera.translateX(-delta * 8 * warp.current)

    if (keys["d"] || keys["arrowright"])
      camera.translateX(delta * 8 * warp.current)
  })

  return null
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      gl={{ alpha: true }}
      className="absolute inset-0 w-full h-full"
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={1.4} />

      <Controls />

      <StarLayer count={7000} size={0.12} speedMultiplier={1} />
      <StarLayer count={5000} size={0.18} speedMultiplier={1.5} />
      <StarLayer count={3000} size={0.25} speedMultiplier={2} />
    </Canvas>
  )
}
