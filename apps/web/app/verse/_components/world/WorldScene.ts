/**
 * WorldScene.ts
 * Orchestrates the full PixiJS scene: tilemap, furniture, characters, UI, camera.
 */
import type { Application, Ticker } from "pixi.js"
import { Container } from "pixi.js"
import { TilemapLayer } from "./TilemapLayer"
import { FurnitureLayer } from "./FurnitureLayer"
import { CharacterLayer } from "./CharacterLayer"
import { UILayer } from "./UILayer"
import { Camera } from "./camera"
import { MAP_COLS, MAP_ROWS, TILE_SIZE, ROOMS } from "./map-data"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

interface SceneCallbacks {
  onRoomChange: (name: string) => void
  onXP: (msg: string) => void
  onNearby: (name: string) => void
}

export class WorldScene {
  private app: Application
  private theme: Theme
  private userName: string
  private callbacks: SceneCallbacks

  private worldContainer!: Container
  private tilemap!: TilemapLayer
  private furniture!: FurnitureLayer
  private characters!: CharacterLayer
  private ui!: UILayer
  private camera!: Camera

  private keys = new Set<string>()
  private lastRoom = ""
  private visitedRooms = new Set<string>()

  constructor(app: Application, theme: Theme, userName: string, callbacks: SceneCallbacks) {
    this.app = app
    this.theme = theme
    this.userName = userName
    this.callbacks = callbacks
  }

  async init() {
    const app = this.app

    // Root world container (camera moves this)
    this.worldContainer = new Container()
    app.stage.addChild(this.worldContainer)

    // Layers — order matters for z
    this.tilemap = new TilemapLayer(this.theme)
    this.furniture = new FurnitureLayer(this.theme)
    this.characters = new CharacterLayer(this.theme, this.userName)
    this.ui = new UILayer()
    this.camera = new Camera(app)

    this.worldContainer.addChild(this.tilemap.container)
    this.worldContainer.addChild(this.furniture.container)
    this.worldContainer.addChild(this.characters.container)
    this.worldContainer.addChild(this.ui.container)

    // Load all layers
    await Promise.all([
      this.tilemap.init(),
      this.furniture.init(),
      this.characters.init(),
    ])

    this.ui.init()

    // Keyboard handlers
    window.addEventListener("keydown", this._onKeyDown)
    window.addEventListener("keyup", this._onKeyUp)

    // Game loop
    app.ticker.add(this._tick)
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code)
    if (e.code === "Space") {
      this.characters.playerGreet()
    }
    // Prevent page scroll
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) {
      e.preventDefault()
    }
  }

  private _onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code)
  }

  private _tick = (ticker: Ticker) => {
    const dt = ticker.deltaTime
    const speed = 2.8 // tiles/sec * dt

    let dx = 0, dy = 0
    if (this.keys.has("ArrowLeft")  || this.keys.has("KeyA")) dx -= speed
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) dx += speed
    if (this.keys.has("ArrowUp")    || this.keys.has("KeyW")) dy -= speed
    if (this.keys.has("ArrowDown")  || this.keys.has("KeyS")) dy += speed

    // Normalise diagonal
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }

    // Move player (pixel units)
    const px = dx * dt
    const py = dy * dt

    const player = this.characters.player
    const newX = Math.max(0, Math.min((MAP_COLS) * TILE_SIZE, player.x + px))
    const newY = Math.max(TILE_SIZE, Math.min((MAP_ROWS) * TILE_SIZE, player.y + py))
    player.x = newX
    player.y = newY

    // Walking animation state
    this.characters.setWalking(dx !== 0 || dy !== 0, dx)

    // Camera follow
    this.camera.follow(this.worldContainer, player.x, player.y)

    // Characters animation tick
    this.characters.tick(dt)

    // UI tick
    this.ui.tick(dt)

    // Proximity NPC check
    const nearby = this.characters.getNearbyNPC(80)
    this.callbacks.onNearby(nearby ?? "")

    // Room detection
    const tileCol = Math.floor(player.x / TILE_SIZE)
    const tileRow = Math.floor(player.y / TILE_SIZE)
    const room = ROOMS.find(r =>
      tileCol >= r.col && tileCol < r.col + r.cols &&
      tileRow >= r.row && tileRow < r.row + r.rows
    )
    const roomName = room?.label ?? "Hallway"

    if (roomName !== this.lastRoom) {
      this.lastRoom = roomName
      this.callbacks.onRoomChange(roomName)

      if (room && !this.visitedRooms.has(room.id) && room.xpTag) {
        this.visitedRooms.add(room.id)
        this.callbacks.onXP(`${room.xpTag} ✨`)
      }
    }
  }

  async switchTheme(theme: Theme) {
    if (theme === this.theme) return
    this.theme = theme
    await this.tilemap.switchTheme(theme)
    await this.furniture.switchTheme(theme)
  }

  destroy() {
    this.app.ticker.remove(this._tick)
    window.removeEventListener("keydown", this._onKeyDown)
    window.removeEventListener("keyup", this._onKeyUp)
    this.tilemap.destroy()
    this.furniture.destroy()
    this.characters.destroy()
    this.ui.destroy()
    this.worldContainer.destroy({ children: true })
  }
}
