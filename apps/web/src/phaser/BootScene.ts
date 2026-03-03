import Phaser from "phaser"

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene")
  }

  preload() {
    this.load.image("tiles", "/assets/tiles.png")
    this.load.tilemapTiledJSON("office-map", "/assets/map.json")
  }

  create() {
    this.scene.start("MainScene")
  }
}