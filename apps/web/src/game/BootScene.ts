import Phaser from "phaser"

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene")
  }

  preload() {
    this.load.image("tiles", "/assets/tiles/office_tiles.png")
    this.load.image("player", "/assets/characters/player.png")
  }

  create() {
    this.scene.start("MainScene")
  }
}