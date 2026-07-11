/**
 * camera.ts
 * Smooth camera that follows the player, clamped to map bounds.
 */
import type { Application, Container } from "pixi.js"
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "./map-data"

const LERP = 0.1 // smoothing factor

export class Camera {
  private app: Application
  private targetX = 0
  private targetY = 0

  constructor(app: Application) {
    this.app = app
  }

  follow(world: Container, playerX: number, playerY: number) {
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const mapW = MAP_COLS * TILE_SIZE
    const mapH = MAP_ROWS * TILE_SIZE

    // Desired camera offset: center player on screen
    let tx = screenW / 2 - playerX
    let ty = screenH / 2 - playerY

    // Clamp so we don't scroll past map edges
    tx = Math.min(0, Math.max(screenW - mapW, tx))
    ty = Math.min(0, Math.max(screenH - mapH, ty))

    // Smooth follow
    world.x += (tx - world.x) * LERP
    world.y += (ty - world.y) * LERP
  }
}
