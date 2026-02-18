"use client"

import { Canvas } from "@react-three/fiber"
import { OrthographicCamera } from "@react-three/drei"
import { Suspense } from "react"

import Player from "./Player"
import Grid from "./Grid"
import CameraController from "./Camera"
import Zones from "./Zone"

type Props = {
  userName?: string
}

export default function WorldCanvas({ userName }: Props) {
  return (
    <Canvas className="absolute inset-0" orthographic>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 100]}
        zoom={50}
      />

      <ambientLight intensity={0.5} />

      <Suspense fallback={null}>
        <CameraController />
        <Grid />
        <Zones />
        <Player userName={userName} />
      </Suspense>
    </Canvas>
  )
}
