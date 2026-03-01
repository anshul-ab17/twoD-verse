import Phaser from "phaser"

export default class OfficeScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys

  constructor() {
    super("OfficeScene")
  }

  preload() {
    // Use placeholder sprite for now
    this.load.image(
      "floor",
      "https://labs.phaser.io/assets/tilemaps/tiles/gridtiles.png"
    )

    this.load.image(
      "player",
      "https://labs.phaser.io/assets/sprites/phaser-dude.png"
    )
  }

  create() {
    this.add.tileSprite(
      0,
      0,
      2000,
      2000,
      "floor"
    ).setOrigin(0)

    this.player = this.physics.add.sprite(
      400,
      300,
      "player"
    )

    this.player.setCollideWorldBounds(true)

    this.cursors = this.input!.keyboard!.createCursorKeys()

    this.cameras.main.startFollow(this.player)
  }

  update() {
    const speed = 200

    this.player.setVelocity(0)

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed)
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed)
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed)
    }
  }
}