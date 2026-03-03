"use client"

import { useEffect, useRef } from "react"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const initGame = async () => {
      if (typeof window === "undefined") return
      if (!containerRef.current) return
      if (gameRef.current) return

      const Phaser = (await import("phaser")).default
      const BootScene = (await import("@/phaser/BootScene")).default
      const MainScene = (await import("@/phaser/MainScene")).default

      if (!mounted) return

      gameRef.current = new Phaser.Game({
        type: Phaser.CANVAS, // safe mode (prevents framebuffer error)
        width: 1600,
        height: 800,
        parent: containerRef.current,
        backgroundColor: "#1e1e1e",
        render: {
          pixelArt: true,
          antialias: false
        },
        scene: [BootScene, MainScene]
      })
    }

    initGame()

    return () => {
      mounted = false
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />
}