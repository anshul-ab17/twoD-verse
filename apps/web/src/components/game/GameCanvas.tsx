"use client"

import { useEffect, useRef } from "react"
import type Phaser from "phaser"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    let mounted = true

    const initGame = async () => {
      if (typeof window === "undefined") return
      if (!containerRef.current) return
      if (gameRef.current) return

      const Phaser = (await import("phaser")).default
      const MainScene = (await import("@/phaser/MainScene")).default

      if (!mounted) return

      gameRef.current = new Phaser.Game({
        type: Phaser.CANVAS, // safe mode (prevents framebuffer error)
        width: 1600,
        height: 800,
        parent: containerRef.current,
        backgroundColor: "#1e1e1e",
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
          },
        },
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        render: {
          pixelArt: true,
          antialias: false
        },
        scene: [MainScene]
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

  return (
    <div
      ref={containerRef}
      className="w-full h-[80vh] min-h-[640px] overflow-hidden rounded-xl"
    />
  )
}
