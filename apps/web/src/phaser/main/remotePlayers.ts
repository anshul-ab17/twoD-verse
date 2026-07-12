import Phaser from "phaser"
import { CHAR_CONFIGS } from "../constants"
import { charForUserId, idleAnimKey, runAnimKey } from "../charUtils"
import { findNearestWalkablePosition } from "./roomLogic"
import type { RealtimePlayer, RemoteAvatar } from "../types"

export class RemotePlayerManager {
  private scene: Phaser.Scene
  private players = new Map<string, RemoteAvatar>()
  private roomByTile: Int16Array | undefined
  private mapW = 0
  private mapH = 0
  private tileW = 32
  private tileH = 32

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  setRoomData(roomByTile: Int16Array, mapW: number, mapH: number, tileW: number, tileH: number) {
    this.roomByTile = roomByTile
    this.mapW = mapW
    this.mapH = mapH
    this.tileW = tileW
    this.tileH = tileH
  }

  private safePos(x: number, y: number, radius = 3) {
    return findNearestWalkablePosition(this.roomByTile, this.mapW, this.mapH, this.tileW, this.tileH, x, y, radius)
      ?? { x, y }
  }

  create(player: RealtimePlayer) {
    const pos = this.safePos(player.x, player.y)
    const char = charForUserId(player.userId)
    const firstFrame = `${CHAR_CONFIGS[char].idlePrefix}1.png`

    const sprite = this.scene.add.sprite(pos.x, pos.y, char, firstFrame)
    sprite.setOrigin(0.5, 1)
    sprite.setDepth(pos.y + 95)
    sprite.play(idleAnimKey(char))

    const displayName = player.userId.length > 11
      ? `${player.userId.slice(0, 8)}...`
      : player.userId

    const label = this.scene.add
      .text(pos.x, pos.y - 44, displayName, {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#e2e8f0",
        backgroundColor: "#111827cc",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 1)
      .setDepth(1200)

    this.players.set(player.userId, { userId: player.userId, sprite, label, targetX: pos.x, targetY: pos.y })
  }

  upsert(player: RealtimePlayer) {
    const pos = this.safePos(player.x, player.y)
    const existing = this.players.get(player.userId)

    if (!existing) {
      this.create({ ...player, x: pos.x, y: pos.y })
      return
    }

    existing.targetX = pos.x
    existing.targetY = pos.y
  }

  sync(players: RealtimePlayer[]) {
    const nextIds = new Set(players.filter((p) => p?.userId).map((p) => p.userId))
    for (const player of players) {
      if (player?.userId) this.upsert(player)
    }
    for (const userId of [...this.players.keys()]) {
      if (!nextIds.has(userId)) this.remove(userId)
    }
  }

  remove(userId: string) {
    const remote = this.players.get(userId)
    if (!remote) return
    remote.sprite.destroy()
    remote.label.destroy()
    this.players.delete(userId)
  }

  clear() {
    for (const userId of [...this.players.keys()]) {
      this.remove(userId)
    }
  }

  update() {
    for (const remote of this.players.values()) {
      const dx = remote.targetX - remote.sprite.x
      const dy = remote.targetY - remote.sprite.y
      const isMoving = Math.abs(dx) > 0.7 || Math.abs(dy) > 0.7
      const lerp = isMoving ? 0.35 : 1

      const nextX = Phaser.Math.Linear(remote.sprite.x, remote.targetX, lerp)
      const nextY = Phaser.Math.Linear(remote.sprite.y, remote.targetY, lerp)
      const pos = this.safePos(nextX, nextY, 2)

      remote.sprite.setPosition(pos.x, pos.y)
      remote.sprite.setDepth(pos.y + 95)

      const char = charForUserId(remote.userId)
      const idle = idleAnimKey(char)
      const run = runAnimKey(char)

      if (isMoving) {
        if (dx < -0.1) remote.sprite.setFlipX(true)
        if (dx > 0.1)  remote.sprite.setFlipX(false)
        if (remote.sprite.anims.currentAnim?.key !== run) remote.sprite.play(run, true)
      } else if (remote.sprite.anims.currentAnim?.key !== idle) {
        remote.sprite.play(idle, true)
      }

      remote.label.setPosition(pos.x, pos.y - remote.sprite.displayHeight - 6)
    }
  }
}
