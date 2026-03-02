"use client"

import { useEffect, useRef } from "react"

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let game: any

    const loadPhaser = async () => {
      const Phaser = (await import("phaser")).default
      const OfficeScene = (await import("./scenes/OfficeScene")).default

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth - 280,
        height: window.innerHeight,
        parent: gameRef.current!,
        pixelArt: true,
        backgroundColor: "#2c3e50",
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        scene: [OfficeScene],
      }

      game = new Phaser.Game(config)
    }

    loadPhaser()

    return () => {
      if (game) {
        game.destroy(true)
      }
    }
  }, [])

  return <div ref={gameRef} className="flex-1" />
}