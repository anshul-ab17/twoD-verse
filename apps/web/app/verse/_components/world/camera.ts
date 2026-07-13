/**
 * camera.ts
 * Smooth camera that follows the player, clamped to map bounds. Applies a
 * fixed zoom; maps smaller than the viewport get centered.
 */
import type { Application, Container } from "pixi.js"
import { MAP_COLS, MAP_ROWS, TILE_SIZE } from "./map-data"

const LERP = 0.1 // smoothing factor
export const ZOOM = 1.5

export class Camera {
  private app: Application

  constructor(app: Application) {
    this.app = app
  }

  follow(world: Container, playerX: number, playerY: number) {
    world.scale.set(ZOOM)
    const screenW = this.app.screen.width
    const screenH = this.app.screen.height
    const mapW = MAP_COLS * TILE_SIZE * ZOOM
    const mapH = MAP_ROWS * TILE_SIZE * ZOOM

    // Desired camera offset: center player on screen
    let tx = screenW / 2 - playerX * ZOOM
    let ty = screenH / 2 - playerY * ZOOM

    // Clamp to map edges; center outright when the map fits on screen
    tx = mapW <= screenW ? (screenW - mapW) / 2 : Math.min(0, Math.max(screenW - mapW, tx))
    ty = mapH <= screenH ? (screenH - mapH) / 2 : Math.min(0, Math.max(screenH - mapH, ty))

    // Smooth follow
    world.x += (tx - world.x) * LERP
    world.y += (ty - world.y) * LERP
  }
}
