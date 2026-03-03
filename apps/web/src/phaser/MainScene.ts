import * as Phaser from "phaser"

export default class MainScene extends Phaser.Scene {
  player!: Phaser.GameObjects.Sprite
  worldContainer!: Phaser.GameObjects.Container

  cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  keys!: any

  worldWidth = 1500
  worldHeight = 1500
  speed = 4

  playerWorldX = 0
  playerWorldY = 0

  constructor() {
    super("MainScene")
  }

  preload() {
    this.load.image("tiles", "/assets/tiles.png")
    this.load.image("player", "/assets/player.png")
  }

  create() {
    const { width, height } = this.scale

    this.worldContainer = this.add.container(0, 0)

    const tileSize = 256

    for (let x = 0; x < this.worldWidth; x += tileSize) {
      for (let y = 0; y < this.worldHeight; y += tileSize) {
        const tile = this.add.image(x, y, "tiles").setOrigin(0)
        this.worldContainer.add(tile)
      }
    }

    // Logical player starts at world center
    this.playerWorldX = this.worldWidth / 2
    this.playerWorldY = this.worldHeight / 2

    // Player sprite fixed at screen center
    this.player = this.add.sprite(width / 2, height / 2, "player")

    // IMPORTANT: position world correctly on start
    this.updateWorldPosition()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys("W,A,S,D")

    const debugText = this.add.text(20, 20, "TwoDverse Running", {
      color: "#ffffff",
      fontSize: "18px",
    })
    debugText.setScrollFactor(0)
  }

  update() {
    let moveX = 0
    let moveY = 0

    if (this.cursors.left?.isDown || this.keys.A.isDown) {
      moveX = -this.speed
    }
    else if (this.cursors.right?.isDown || this.keys.D.isDown) {
      moveX = this.speed
    }

    if (this.cursors.up?.isDown || this.keys.W.isDown) {
      moveY = -this.speed
    }
    else if (this.cursors.down?.isDown || this.keys.S.isDown) {
      moveY = this.speed
    }

    const vec = new Phaser.Math.Vector2(moveX, moveY)

    if (vec.length() > 0) {
      vec.normalize().scale(this.speed)
      this.playerWorldX += vec.x
      this.playerWorldY += vec.y
    }

    this.clampPlayer()
    this.updateWorldPosition()
  }

  clampPlayer() {
    this.playerWorldX = Phaser.Math.Clamp(
      this.playerWorldX,
      0,
      this.worldWidth
    )

    this.playerWorldY = Phaser.Math.Clamp(
      this.playerWorldY,
      0,
      this.worldHeight
    )
  }

  updateWorldPosition() {
    const { width, height } = this.scale

    this.worldContainer.x = Math.round(width / 2 - this.playerWorldX)
    this.worldContainer.y = Math.round(height / 2 - this.playerWorldY)
  }
}