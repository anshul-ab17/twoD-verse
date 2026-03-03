import Phaser from "phaser"

export default class MainScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  keys!: any

  constructor() {
    super("MainScene")
  }

  create() {
    const map = this.make.tilemap({ key: "office-map" })
    const tileset = map.addTilesetImage("tiles", "tiles")
    if (!tileset) {
      console.error("Tileset not found")
      return
    }

    const floorLayer = map.createLayer("Floor", tileset)
    if (!floorLayer) {
      console.error("Floor layer missing")
      return
    }

    // Enable camera bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)

    // Create player
    this.player = this.physics.add.sprite(200, 200, undefined as any)
    this.player.setSize(20, 20)
    this.player.setCollideWorldBounds(true)

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys("W,A,S,D")
  }

  update() {
    if (!this.cursors) return

    const speed = 200
    let vx = 0
    let vy = 0

    if (this.cursors.left?.isDown || this.keys?.A?.isDown) vx = -speed
    else if (this.cursors.right?.isDown || this.keys?.D?.isDown) vx = speed

    if (this.cursors.up?.isDown || this.keys?.W?.isDown) vy = -speed
    else if (this.cursors.down?.isDown || this.keys?.S?.isDown) vy = speed

    this.player.setVelocity(vx, vy)

    if (vx !== 0 || vy !== 0) {
      this.player!.body!.velocity.normalize().scale(speed)
    }
  }
}