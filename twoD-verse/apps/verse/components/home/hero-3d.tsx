"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Points, PointMaterial } from "@react-three/drei"
import { useRef, useMemo } from "react"
import * as THREE from "three"

function FloatingParticles() {
  const ref = useRef<THREE.Points>(null!)

  const particles = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30
      positions[i * 3 + 1] = Math.random() * 15
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return positions
  }, [])

  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.02
  })

  return (
    <Points ref={ref} positions={particles} stride={3}>
      <PointMaterial
        transparent
        size={0.05}
        color="#9f7aea"
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

function FloatingGround() {
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    meshRef.current.rotation.y = t * 0.05
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.2, 0, 0]}
      position={[0, -3, 0]}
    >
      <circleGeometry args={[8, 64]} />
      <meshStandardMaterial
        color="#1a1a2e"
        emissive="#3b0a45"
        emissiveIntensity={1.2}
      />
    </mesh>
  )
}

function CameraDrift() {
  const { camera, pointer } = useThree()

  useFrame(() => {
    camera.position.x += (pointer.x * 2 - camera.position.x) * 0.02
    camera.position.y += (pointer.y * 1 - camera.position.y) * 0.02
  })

  return null
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 10], fov: 50 }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#050509"]} />
      <fog attach="fog" args={["#050509", 10, 40]} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

      <CameraDrift />
      <FloatingParticles />
      <FloatingGround />
    </Canvas>
  )
}
