import * as Phaser from "phaser"

export function loadSpace(scene: Phaser.Scene, spaceId: string) {
  console.log("Loading space:", spaceId)

  scene.add.rectangle(1000, 600, 2000, 1200, 0x1e1e1e)
}
