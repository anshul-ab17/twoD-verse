"use client"

import { useEffect } from "react"
import * as Phaser from "phaser"
import { gameConfig } from "@/game/config"

export default function GameCanvas() {
  useEffect(() => {
    const game = new Phaser.Game(gameConfig)

    return () => {
      game.destroy(true)
    }
  }, [])

  return (
    <div
      id="phaser-container"
      className="w-full h-full"
    />
  )
}