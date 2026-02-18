import Phaser from "phaser"

export function createPlayer(scene: Phaser.Scene) {
  const player = scene.physics.add.sprite(400, 300, "player")
  player.setCollideWorldBounds(true)
  return player
}
