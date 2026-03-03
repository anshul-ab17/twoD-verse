"use client"

import { useEffect, useRef } from "react"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<any>(null)

  useEffect(() => {
    let isMounted = true

    const initGame = async () => {
      // Prevent server execution
      if (typeof window === "undefined") return

      // Prevent duplicate creation (StrictMode fix)
      if (gameRef.current) return

      if (!containerRef.current) return

      try {
        const Phaser = (await import("phaser")).default
        const BootScene = (await import("@/phaser/BootScene")).default
        const MainScene = (await import("@/phaser/MainScene")).default

        if (!isMounted) return

        gameRef.current = new Phaser.Game({
          type: Phaser.AUTO,
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
          scene: [BootScene, MainScene],
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        })
      } catch (err) {
        console.error("Phaser initialization failed:", err)
      }
    }

    initGame()

    return () => {
      isMounted = false

      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
    />
  )
}