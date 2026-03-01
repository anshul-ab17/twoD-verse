import * as Phaser from "phaser"
import { createPlayer } from "../entities/Player"
import { buildOffice } from "../world/OfficeLayout"
import { loadSpace } from "../world/loadSpace"
import { setupCollisions } from "../systems/CollisionSystem"
import { setupMultiplayer } from "../systems/MultiplayerSystem"

export class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private spaceId: string
  private userName: string

  constructor(data: { spaceId: string; userName: string }) {
    super("OfficeScene")
    this.spaceId = data.spaceId
    this.userName = data.userName
  }

  preload() {
    this.load.image("player", "/assets/player.png")
  }

  create() {
    loadSpace(this, this.spaceId)

    const desks = buildOffice(this)

    this.player = createPlayer(this)

    this.cursors = this.input.keyboard!.createCursorKeys()

    this.cameras.main.startFollow(this.player)
    this.cameras.main.setBounds(0, 0, 2000, 1200)
    this.physics.world.setBounds(0, 0, 2000, 1200)

    setupCollisions(this, this.player, desks)

    setupMultiplayer(this, this.player, this.userName)
  }

  update() {
    const speed = 180
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
