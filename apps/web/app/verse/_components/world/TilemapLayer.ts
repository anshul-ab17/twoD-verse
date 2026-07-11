/**
 * TilemapLayer.ts
 * Tiles the floor and wall sprites across the entire map.
 */
import { Container, TilingSprite, Assets, Graphics } from "pixi.js"
import { TILE_SIZE, MAP_COLS, MAP_ROWS } from "./map-data"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

const FLOOR_FILE: Record<Theme, string> = {
  office:  "floor_wood",
  cafe:    "floor_wood",
  zen:     "floor_soft",
  library: "floor_soft",
  lounge:  "floor_wood",
}

export class TilemapLayer {
  container: Container
  private theme: Theme
  private floor: TilingSprite | null = null
  private wallStrip: TilingSprite | null = null

  constructor(theme: Theme) {
    this.container = new Container()
    this.theme = theme
  }

  async init() {
    await this._build(this.theme)
  }

  private async _build(theme: Theme) {
    // Clear previous
    this.container.removeChildren()

    const floorKey = FLOOR_FILE[theme]
    const floorPath = `/_godot/assets/tiles/${theme}/${floorKey}.png`
    const wallPath  = `/_godot/assets/tiles/${theme}/wall.png`

    const [floorTex, wallTex] = await Promise.all([
      Assets.load(floorPath),
      Assets.load(wallPath),
    ])

    const mapW = MAP_COLS * TILE_SIZE
    const mapH = MAP_ROWS * TILE_SIZE

    // Floor
    const floor = new TilingSprite({
      texture: floorTex,
      width: mapW,
      height: mapH,
    })
    floor.tileScale.set(TILE_SIZE / 32)
    floor.x = 0
    floor.y = TILE_SIZE // below wall strip
    this.floor = floor
    this.container.addChild(floor)

    // Wall strip (top row)
    const wall = new TilingSprite({
      texture: wallTex,
      width: mapW,
      height: TILE_SIZE,
    })
    wall.tileScale.set(TILE_SIZE / 32)
    wall.x = 0
    wall.y = 0
    this.wallStrip = wall
    this.container.addChild(wall)

    // Room zone tints (subtle overlay rectangles)
    this._drawRoomOverlays()
  }

  private _drawRoomOverlays() {
    const g = new Graphics()
    const zones = [
      { x: 1, y: 2, w: 10, h: 8, color: 0x4a78c8, alpha: 0.06 },
      { x: 13, y: 2, w: 10, h: 8, color: 0xc84a4a, alpha: 0.06 },
      { x: 1, y: 13, w: 10, h: 9, color: 0x4ac878, alpha: 0.06 },
      { x: 13, y: 13, w: 10, h: 9, color: 0xc8a84a, alpha: 0.06 },
    ]
    for (const z of zones) {
      g.rect(z.x * TILE_SIZE, z.y * TILE_SIZE, z.w * TILE_SIZE, z.h * TILE_SIZE)
       .fill({ color: z.color, alpha: z.alpha })
    }
    this.container.addChild(g)
  }

  async switchTheme(theme: Theme) {
    this.theme = theme
    await this._build(theme)
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
