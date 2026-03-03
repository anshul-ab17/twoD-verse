import Phaser from "phaser"
import BootScene from "@/phaser/BootScene"
import MainScene from "@/phaser/MainScene"

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#0f172a",
  scene: [BootScene, MainScene]
}