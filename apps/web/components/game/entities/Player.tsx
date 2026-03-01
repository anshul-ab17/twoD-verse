import * as Phaser from "phaser"

export function createPlayer(scene: Phaser.Scene) {
  const player = scene.physics.add.sprite(400, 300, "player")

  player.setCollideWorldBounds(true)
  player.setScale(0.5)

  return player
}
