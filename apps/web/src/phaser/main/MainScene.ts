import Phaser from "phaser"
import { MAP_KEY, MAP_URL, CHAR_KEYS, CHAR_CONFIGS, TILESETS, THEME_BG } from "../constants"
import { idleAnimKey, runAnimKey } from "../charUtils"
import { markBlockedTiles, buildRooms } from "../roomUtils"
import { ensurePlayerAnimations } from "./animations"
import { getColliderRects, computePlayableBounds, renderObjectLayers, createColliders } from "./mapSetup"
import { buildInteractables } from "./interactables"
import { findSpawnPoint, getRoomIdAtWorld } from "./roomLogic"
import { RemotePlayerManager } from "./remotePlayers"
import { clampPlayerSpriteToWorld, updateCameraMotion } from "./camera"
import {
  sitAtInteractable, standUpFromSeat, rescueIfEmbedded,
  updateInteractionPrompt, handleInteraction, showInteractionStatus,
} from "./playerActions"
import { emitPlayerState, bindRemotePlayerEvents, unbindRemotePlayerEvents } from "./eventBridge"
import type { CharKey, Interactable } from "../types"

export default class MainScene extends Phaser.Scene {
  charKey: CharKey = "adam"

  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  colliders?: Phaser.Physics.Arcade.StaticGroup
  roomLabel?: Phaser.GameObjects.Text
  interactionPrompt?: Phaser.GameObjects.Text
  interactionStatus?: Phaser.GameObjects.Text
  interactionStatusTimer?: Phaser.Time.TimerEvent
  interactables: Interactable[] = []
  activeInteractable?: Interactable
  seatedInteractable?: Interactable
  preSeatX = 0
  preSeatY = 0
  interactKey?: Phaser.Input.Keyboard.Key
  isSeated = false
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  keys?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }

  roomByTile?: Int16Array
  roomCount = 0
  currentRoomId = -1
  mapWidthInTiles = 0
  mapHeightInTiles = 0
  tileWidth = 32
  tileHeight = 32

  worldMinX = 0
  worldMinY = 0
  worldMaxX = 0
  worldMaxY = 0
  lastSafeX = 0
  lastSafeY = 0
  cameraLookX = 0
  cameraLookY = 0

  lastStateEmitAt = 0
  lastStateEmitX = Number.NaN
  lastStateEmitY = Number.NaN
  lastStateEmitRoom = Number.NaN

  remoteManager!: RemotePlayerManager

  onRemotePlayersSync?: (event: Event) => void
  onRemotePlayerUpsert?: (event: Event) => void
  onRemotePlayerLeft?: (event: Event) => void
  onThemeChange?: (event: Event) => void

  constructor() {
    super("MainScene")
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("twodverse:character")
      if (saved && saved in CHAR_CONFIGS) this.charKey = saved as CharKey
    }
  }

  preload() {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error("[MainScene] asset load failed:", file.key, file.src)
    })

    if (!this.cache.tilemap.exists(MAP_KEY)) {
      this.load.tilemapTiledJSON(MAP_KEY, MAP_URL)
    }

    for (const tileset of TILESETS) {
      if (!this.textures.exists(tileset.key)) {
        this.load.spritesheet(tileset.key, tileset.url, { frameWidth: tileset.tileWidth, frameHeight: tileset.tileHeight })
      }
    }

    for (const key of CHAR_KEYS) {
      if (!this.textures.exists(key)) {
        this.load.atlas(key, CHAR_CONFIGS[key].imageUrl, CHAR_CONFIGS[key].atlasUrl)
      }
    }
  }

  create() {
    const savedTheme = typeof window !== "undefined"
      ? (localStorage.getItem("twodverse:theme") ?? "woody")
      : "woody"
    this.applyTheme(savedTheme)

    this.remoteManager = new RemotePlayerManager(this)
    ensurePlayerAnimations(this)

    const map = this.make.tilemap({ key: MAP_KEY })
    const mapTilesets = TILESETS
      .map((t) => map.addTilesetImage(t.mapName, t.key))
      .filter((t): t is Phaser.Tilemaps.Tileset => Boolean(t))

    if (mapTilesets.length === 0) {
      console.error("[MainScene] no tilesets bound")
      return
    }

    let layerDepth = 0
    for (const name of map.layers.map((l) => l.name)) {
      const layer = map.createLayer(name, mapTilesets)
      if (layer) layer.setDepth(layerDepth++)
    }

    renderObjectLayers(this, map)

    const bounds = computePlayableBounds(map)
    this.worldMinX = bounds.x
    this.worldMinY = bounds.y
    this.worldMaxX = bounds.x + bounds.width
    this.worldMaxY = bounds.y + bounds.height
    this.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height)
    this.cameras.main.setBounds(bounds.x, bounds.y, bounds.width, bounds.height)

    const colliderRects = getColliderRects(map)
    this.colliders = createColliders(this, colliderRects)

    const roomData = buildRooms(map, markBlockedTiles(map, colliderRects))
    this.roomByTile = roomData.roomByTile
    this.roomCount = roomData.roomCount
    this.mapWidthInTiles = roomData.mapWidthInTiles
    this.mapHeightInTiles = roomData.mapHeightInTiles
    this.tileWidth = roomData.tileWidth
    this.tileHeight = roomData.tileHeight
    this.remoteManager.setRoomData(roomData.roomByTile, roomData.mapWidthInTiles, roomData.mapHeightInTiles, roomData.tileWidth, roomData.tileHeight)

    this.interactables = buildInteractables(map)

    const spawn = findSpawnPoint(this.roomByTile, this.mapWidthInTiles, this.mapHeightInTiles, this.tileWidth, this.tileHeight)
    const firstFrame = `${CHAR_CONFIGS[this.charKey].idlePrefix}1.png`

    this.player = this.physics.add.sprite(spawn.x, spawn.y, this.charKey, firstFrame)
    this.player.setOrigin(0.5, 1)
    this.player.setSize(18, 20)
    this.player.setOffset(7, 28)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(spawn.y + 100)
    this.player.play(idleAnimKey(this.charKey))
    this.lastSafeX = spawn.x
    this.lastSafeY = spawn.y

    if (this.colliders) this.physics.add.collider(this.player, this.colliders)

    this.cameras.main.startFollow(this.player, true, 1, 1)
    this.cameras.main.setDeadzone(0, 0)
    this.cameras.main.setZoom(1.45)
    this.cameras.main.roundPixels = true

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as typeof this.keys
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    this.roomLabel = this.add
      .text(16, 16, "Room: --", { fontFamily: "monospace", fontSize: "14px", color: "#e2e8f0", backgroundColor: "#02061799", padding: { x: 8, y: 4 } })
      .setDepth(1200).setScrollFactor(0)

    this.interactionPrompt = this.add
      .text(16, 44, "", { fontFamily: "monospace", fontSize: "13px", color: "#f8fafc", backgroundColor: "#0f172aa6", padding: { x: 8, y: 4 } })
      .setDepth(1200).setScrollFactor(0).setVisible(false)

    this.interactionStatus = this.add
      .text(16, 72, "", { fontFamily: "monospace", fontSize: "13px", color: "#fde68a", backgroundColor: "#451a03b0", padding: { x: 8, y: 4 } })
      .setDepth(1200).setScrollFactor(0).setVisible(false)

    this.applyRoomLogic()
    this.activeInteractable = updateInteractionPrompt(this)
    emitPlayerState(this, true)
    bindRemotePlayerEvents(this, this.remoteManager)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unbindRemotePlayerEvents(this)
      this.remoteManager.clear()
    })
  }

  update() {
    if (!this.cursors || !this.keys || !this.player) return

    const speed = 200
    let vx = 0
    let vy = 0

    if (this.cursors.left?.isDown  || this.keys.A?.isDown) vx = -speed
    else if (this.cursors.right?.isDown || this.keys.D?.isDown) vx = speed
    if (this.cursors.up?.isDown    || this.keys.W?.isDown) vy = -speed
    else if (this.cursors.down?.isDown  || this.keys.S?.isDown) vy = speed

    if (this.isSeated && (vx !== 0 || vy !== 0)) {
      standUpFromSeat(this)
      showInteractionStatus(this, "Stood up")
    }

    if (this.isSeated) {
      this.player.setVelocity(0, 0)
      this.player.setFrame(CHAR_CONFIGS[this.charKey].sitFrame)
    } else {
      this.player.setVelocity(vx, vy)
      if (vx !== 0 || vy !== 0) {
        this.player.body.velocity.normalize().scale(speed)
        this.player.play(runAnimKey(this.charKey), true)
        if (vx < 0) this.player.setFlipX(true)
        if (vx > 0) this.player.setFlipX(false)
      } else {
        this.player.play(idleAnimKey(this.charKey), true)
      }
    }

    clampPlayerSpriteToWorld(this.player, this.worldMinX, this.worldMinY, this.worldMaxX, this.worldMaxY)
    const { lookX, lookY } = updateCameraMotion(this.cameras.main, this.cameraLookX, this.cameraLookY, vx, vy, this.isSeated)
    this.cameraLookX = lookX
    this.cameraLookY = lookY

    this.player.setDepth(this.player.y + 100)
    this.remoteManager.update()
    this.applyRoomLogic()
    rescueIfEmbedded(this)
    emitPlayerState(this)
    this.activeInteractable = updateInteractionPrompt(this)

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      handleInteraction(this)
    }
  }

  applyTheme(themeKey: string) {
    this.cameras.main.setBackgroundColor(THEME_BG[themeKey] ?? "#1e1e1e")
  }

  private applyRoomLogic() {
    if (!this.player || !this.roomByTile || !this.roomLabel) return

    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    const footX = body ? body.center.x : this.player.x
    const footY = body ? body.bottom - 1 : this.player.y
    const roomId = getRoomIdAtWorld(this.roomByTile, this.mapWidthInTiles, this.mapHeightInTiles, this.tileWidth, this.tileHeight, footX, footY)

    if (roomId < 0) {
      this.player.setPosition(this.lastSafeX, this.lastSafeY)
      this.player.setVelocity(0, 0)
      return
    }

    this.lastSafeX = this.player.x
    this.lastSafeY = this.player.y

    if (roomId === this.currentRoomId) return
    this.currentRoomId = roomId
    this.roomLabel.setText(`Room ${roomId + 1}/${Math.max(this.roomCount, 1)}`)
  }
}
