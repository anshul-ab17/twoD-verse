/**
 * WorldScene.ts
 * Orchestrates the full PixiJS scene: tilemap, furniture, characters, UI, camera.
 * Movement is server-authoritative: keys send MOVE intents to Colyseus, the
 * player sprite lerps toward the server position; remotes sample snapshot
 * buffers (interpolation delay hides the 20hz tick).
 */
import type { Application, Ticker } from "pixi.js"
import { Container } from "pixi.js"
import { proximityGain } from "@repo/game-core"
import { applyProximityGains } from "../../../../lib/media"
import { TilemapLayer } from "./TilemapLayer"
import { FurnitureLayer } from "./FurnitureLayer"
import { CharacterLayer } from "./CharacterLayer"
import { UILayer } from "./UILayer"
import { Camera } from "./camera"
import { TILE_SIZE, ROOMS } from "./map-data"
import type { WorldNet } from "./net"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

interface SceneCallbacks {
  onRoomChange: (name: string) => void
  onXP: (msg: string) => void
  onNearby: (name: string) => void
}

// display-position smoothing toward the authoritative server position
const OWN_LERP = 0.35
const SNAP_DIST = 200 // teleport instead of gliding across the map (spawn/rejoin)
const PROXIMITY_MS = 250

export class WorldScene {
  private app: Application
  private theme: Theme
  private character: string
  private userName: string
  private net: WorldNet
  private callbacks: SceneCallbacks

  private worldContainer!: Container
  private tilemap!: TilemapLayer
  private furniture!: FurnitureLayer
  private characters!: CharacterLayer
  private ui!: UILayer
  private camera!: Camera

  private keys = new Set<string>()
  private lastInput = { dx: 0, dy: 0 }
  private lastRoom = ""
  private visitedRooms = new Set<string>()
  private lastProx = 0

  constructor(
    app: Application,
    theme: Theme,
    character: string,
    userName: string,
    net: WorldNet,
    callbacks: SceneCallbacks,
  ) {
    this.app = app
    this.theme = theme
    this.character = character
    this.userName = userName
    this.net = net
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
    this.characters = new CharacterLayer(this.character, this.userName)
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

    // Remote players from Colyseus (replays anyone already in the room)
    this.net.onRemoteAdd((id, r) => {
      this.characters
        .addRemote(id, r.state.character || "luffy", r.state.id.slice(0, 8))
        .catch((err) => console.error("remote avatar load failed", id, err))
    })
    this.net.onRemoteRemove((id) => this.characters.removeRemote(id))

    // Snap own avatar to the server spawn point
    const own = this.net.own()
    if (own) {
      this.characters.player.x = own.x
      this.characters.player.y = own.y
    }

    // Keyboard handlers
    window.addEventListener("keydown", this._onKeyDown)
    window.addEventListener("keyup", this._onKeyUp)

    // Game loop
    app.ticker.add(this._tick)
  }

  sendChat(text: string) {
    this.net.sendChat(text)
  }

  private _isTyping() {
    const active = document.activeElement
    return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this._isTyping()) return
    this.keys.add(e.code)
    if (e.code === "Space") this.characters.playerGreet()
    // Prevent page scroll
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault()
    }
  }

  private _onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code)
  }

  private _tick = (ticker: Ticker) => {
    const dt = ticker.deltaTime
    const now = performance.now()

    // --- input intent -> server (only when it changes) ---
    if (this._isTyping()) this.keys.clear()
    const dx = (this.keys.has("ArrowRight") || this.keys.has("KeyD") ? 1 : 0)
      - (this.keys.has("ArrowLeft") || this.keys.has("KeyA") ? 1 : 0)
    const dy = (this.keys.has("ArrowDown") || this.keys.has("KeyS") ? 1 : 0)
      - (this.keys.has("ArrowUp") || this.keys.has("KeyW") ? 1 : 0)
    if (dx !== this.lastInput.dx || dy !== this.lastInput.dy) {
      this.lastInput = { dx, dy }
      this.net.sendMove(dx, dy)
    }

    // --- own player: lerp toward the authoritative position ---
    const own = this.net.own()
    const player = this.characters.player
    if (own) {
      const ex = own.x - player.x
      const ey = own.y - player.y
      if (Math.abs(ex) + Math.abs(ey) > SNAP_DIST) {
        player.x = own.x
        player.y = own.y
      } else {
        player.x += ex * OWN_LERP
        player.y += ey * OWN_LERP
      }
    }
    this.characters.setWalking(dx !== 0 || dy !== 0, dx)

    // --- remote players: sample interpolation buffers ---
    for (const [id, r] of this.net.remotes) {
      const pos = r.buf.sample(now)
      if (pos) this.characters.setRemotePos(id, pos.x, pos.y)
    }

    // --- proximity voice gains (throttled; identity = userId) ---
    if (own && now - this.lastProx > PROXIMITY_MS) {
      this.lastProx = now
      const gains = new Map<string, number>()
      for (const r of this.net.remotes.values()) {
        const d = Math.hypot(r.state.x - own.x, r.state.y - own.y)
        gains.set(r.state.id, proximityGain(d))
      }
      applyProximityGains(gains)
    }

    // Camera follow
    this.camera.follow(this.worldContainer, player.x, player.y)

    // Characters animation tick
    this.characters.tick(dt)

    // UI tick
    this.ui.tick(dt)

    // Proximity NPC check
    const nearby = this.characters.getNearbyNPC(80)
    this.callbacks.onNearby(nearby ?? "")

    // Room detection (client-side HUD label; media zones come from the server)
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
        this.callbacks.onXP(room.xpTag)
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
    if (this.lastInput.dx !== 0 || this.lastInput.dy !== 0) this.net.sendMove(0, 0)
    this.tilemap.destroy()
    this.furniture.destroy()
    this.characters.destroy()
    this.ui.destroy()
    this.worldContainer.destroy({ children: true })
  }
}
