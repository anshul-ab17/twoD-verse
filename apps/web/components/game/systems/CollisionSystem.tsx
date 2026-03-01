import * as Phaser from "phaser"

export function setupCollisions(
  scene: Phaser.Scene,
  player: Phaser.Physics.Arcade.Sprite,
  desks: Phaser.Physics.Arcade.StaticGroup
) {
  scene.physics.add.collider(player, desks)
}
