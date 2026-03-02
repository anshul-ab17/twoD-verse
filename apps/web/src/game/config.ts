import Phaser from "phaser"
import { BootScene } from "@/game/BootScene"
import { MainScene } from "@/game/MainScene"

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  parent: "phaser-container",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, MainScene],
  backgroundColor: "#1e1e1e",
}