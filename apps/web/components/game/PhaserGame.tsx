"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { OfficeScene } from "./scenes/OfficeScene"

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1200,
      height: 700,
      parent: "phaser-container",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 }, // ✅ fixed
          debug: false,
        },
      },
      scene: [OfficeScene],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  return <div id="phaser-container" />
}
