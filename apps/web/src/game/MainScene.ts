import Phaser from "phaser"

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super("MainScene")
  }

  create() {
    this.player = this.physics.add.sprite(400, 300, "player")
    this.player.setCollideWorldBounds(true)

    this.cursors = this.input!.keyboard!.createCursorKeys()
  }

  update() {
    const speed = 200
    this.player.setVelocity(0)

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed)
    }
    if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed)
    }
    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed)
    }
    if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed)
    }
  }
}