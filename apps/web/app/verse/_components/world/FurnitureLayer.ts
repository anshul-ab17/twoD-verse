/**
 * FurnitureLayer.ts
 * Loads and places all furniture sprites from Godot-generated assets.
 * Items are z-sorted by Y position (painter's algorithm).
 */
import { Container, Sprite, Assets } from "pixi.js"
import { FURNITURE_LAYOUT, TILE_SIZE } from "./map-data"
import type { FurnitureDef } from "./map-data"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

export class FurnitureLayer {
  container: Container
  private theme: Theme
  private sprites: Sprite[] = []

  constructor(theme: Theme) {
    this.container = new Container()
    this.theme = theme
  }

  async init() {
    await this._build(this.theme)
  }

  private async _build(theme: Theme) {
    this.container.removeChildren()
    this.sprites = []

    // Pre-load all unique furniture textures for this theme
    const uniqueKeys = [...new Set(FURNITURE_LAYOUT.map(f => f.key))]
    const textures = await Assets.load(
      uniqueKeys.map(k => `/_godot/assets/furniture/${theme}/${k}.png`)
    )

    // Place sprites
    for (const def of FURNITURE_LAYOUT) {
      const path = `/_godot/assets/furniture/${theme}/${def.key}.png`
      const tex = textures[path]
      if (!tex) continue

      const sprite = new Sprite(tex)
      sprite.anchor.set(def.anchorX ?? 0.5, def.anchorY ?? 1)
      sprite.x = (def.col + 0.5) * TILE_SIZE
      sprite.y = (def.row + 1) * TILE_SIZE
      sprite.scale.set(def.scale ?? 1)

      // Pixelated rendering
      if (tex.source) tex.source.scaleMode = "nearest"

      this.sprites.push(sprite)
      this.container.addChild(sprite)
    }

    // Z-sort by y
    this._zsort()
  }

  private _zsort() {
    this.sprites.sort((a, b) => a.y - b.y)
    for (let i = 0; i < this.sprites.length; i++) {
      this.sprites[i]!.zIndex = i
    }
    this.container.sortChildren()
  }

  async switchTheme(theme: Theme) {
    this.theme = theme
    await this._build(theme)
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
