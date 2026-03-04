"use client"

import { useEffect, useRef, useState } from "react"
import type Phaser from "phaser"

export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [status, setStatus] = useState("init: waiting")

  useEffect(() => {
    let isMounted = true

    const initGame = async () => {
      // Prevent server execution
      if (typeof window === "undefined") return

      // Prevent duplicate creation (StrictMode fix)
      if (gameRef.current) return

      if (!containerRef.current) return

      try {
        setStatus("init: importing phaser")
        const Phaser = (await import("phaser")).default
        const MainScene = (await import("@/phaser/MainScene")).default

        if (!isMounted) return

        setStatus("init: creating game")
        gameRef.current = new Phaser.Game({
          type: Phaser.CANVAS,
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
          scene: [MainScene],
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
        })
        setStatus("")
      } catch (err) {
        setStatus("init: failed (check console)")
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
    <div className="relative">
      <div
        className="absolute left-3 top-3 z-10 rounded bg-black/70 px-2 py-1 text-xs text-cyan-300"
      >
        {status}
      </div>

      <div
        ref={containerRef}
        className="w-full h-[80vh] min-h-[640px] overflow-hidden rounded-xl"
      />
    </div>
  )
}
