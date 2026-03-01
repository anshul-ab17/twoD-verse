"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import OfficeScene from "./scenes/OfficeScene"

export default function PhaserGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserInstance = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth - 280, // minus sidebar
      height: window.innerHeight,
      parent: gameRef.current,
      pixelArt: true,
      backgroundColor: "#2c3e50",
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      scene: [OfficeScene],
    }

    phaserInstance.current = new Phaser.Game(config)

    return () => {
      phaserInstance.current?.destroy(true)
    }
  }, [])

  return <div ref={gameRef} className="flex-1" />
}