import Phaser from "phaser"
import { createPlayer } from "../entities/Player"

export class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super("OfficeScene")
  }

  preload() {
    this.load.image("player", "/assets/player.png")
  }

  create() {
    this.player = createPlayer(this)
    this.cursors = this.input.keyboard.createCursorKeys()
    this.cameras.main.startFollow(this.player)
  }

  update() {
    const speed = 120

    this.player.setVelocity(0)

    if (this.cursors.left?.isDown)
      this.player.setVelocityX(-speed)
    else if (this.cursors.right?.isDown)
      this.player.setVelocityX(speed)

    if (this.cursors.up?.isDown)
      this.player.setVelocityY(-speed)
    else if (this.cursors.down?.isDown)
      this.player.setVelocityY(speed)
  }
}
