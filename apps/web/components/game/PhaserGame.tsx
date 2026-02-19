"use client"

import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { OfficeScene } from "./scenes/OfficeScene"

export default function PhaserGame({
  spaceId,
  userName,
}: {
  spaceId: string
  userName: string
}) {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1600,
      height: 900,
      parent: "phaser-container",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [
        new OfficeScene({ spaceId, userName })
      ],
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [spaceId, userName])

  return <div id="phaser-container" />
}
