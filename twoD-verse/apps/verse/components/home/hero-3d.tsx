"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

function NeonWave() {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { pointer } = useThree()

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    const material = meshRef.current.material as THREE.ShaderMaterial

    material.uniforms.uTime.value = time
    material.uniforms.upointer.value = new THREE.Vector2(
      pointer.x,
      pointer.y
    )
  })

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      upointer: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 upointer;
      varying float vElevation;

      void main() {
        vec3 pos = position;

        float wave =
          sin(pos.x * 1.5 + uTime) * 0.4 +
          cos(pos.y * 1.5 + uTime) * 0.4;

        float pointerInfluence =
          sin(distance(pos.xy, upointer * 6.0) * 4.0 - uTime) * 0.5;

        pos.z += wave + pointerInfluence;

        vElevation = pos.z;

        gl_Position = projectionMatrix *
                      modelViewMatrix *
                      vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying float vElevation;

      void main() {
        float intensity = vElevation * 0.8 + 0.5;

        vec3 deepPurple = vec3(0.15, 0.0, 0.35);
        vec3 neonBlue   = vec3(0.0, 0.8, 1.0);

        vec3 color = mix(deepPurple, neonBlue, intensity);

        gl_FragColor = vec4(color * 1.3, 1.0);
      }
    `,
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.3, 0, 0]}
      position={[0, -2, 0]}   // 👈 push wave lower
      material={shaderMaterial}
    >
      <planeGeometry args={[40, 40, 150, 150]} />
    </mesh>
  )
}

export default function Hero3D() {
  return (
    <Canvas
      camera={{ position: [0, 6, 12], fov: 55 }}
      className="absolute inset-0"
    >
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 10, 40]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />

      <Stars
        radius={100}
        depth={50}
        count={4000}
        factor={4}
        saturation={0}
        fade
      />

      <NeonWave />
    </Canvas>
  )
}
