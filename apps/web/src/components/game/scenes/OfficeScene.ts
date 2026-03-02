import Phaser from "phaser"

export default class OfficeScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  nameLabel!: Phaser.GameObjects.Text

  declare input: Phaser.Input.InputPlugin

  constructor() {
    super("OfficeScene")
  }

  preload() { 
    this.load.image(
      "office",
      "https://i.imgur.com/3e5ZKkT.png"
    )

    this.load.spritesheet(
      "avatar",
      "https://labs.phaser.io/assets/sprites/dude.png",
      { frameWidth: 32, frameHeight: 48 }
    )
  }

  create() {
    // Office background
    this.add.image(0, 0, "office").setOrigin(0)

    // Set world bounds (adjust if needed)
    this.physics.world.setBounds(0, 0, 2000, 2000)

    // Player spawn
    this.player = this.physics.add.sprite(
      500,
      400,
      "avatar",
      4
    )

    this.player.setCollideWorldBounds(true)

    // Camera follow
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setZoom(1.5)

    // Keyboard
    this.cursors = this.input!.keyboard!.createCursorKeys()

    // Animations
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("avatar", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: "turn",
      frames: [{ key: "avatar", frame: 4 }],
      frameRate: 20,
    })

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("avatar", {
        start: 5,
        end: 8,
      }),
      frameRate: 10,
      repeat: -1,
    })

    // Name label
    this.nameLabel = this.add
      .text(this.player.x, this.player.y - 40, "You", {
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#4c51bf",
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
  }

  update() {
    const speed = 200
    this.player.setVelocity(0)

    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-speed)
      this.player.anims.play("left", true)
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(speed)
      this.player.anims.play("right", true)
    } else {
      this.player.anims.play("turn")
    }

    if (this.cursors.up?.isDown) {
      this.player.setVelocityY(-speed)
    } else if (this.cursors.down?.isDown) {
      this.player.setVelocityY(speed)
    }

    // Update name position
    this.nameLabel.setPosition(
      this.player.x,
      this.player.y - 40
    )
  }
}