import Phaser from "phaser"

const MAP_KEY = "workspace-map"
const MAP_URL = "/asset/map/map.json"
const CHARACTER_ATLAS_KEY = "adam"
const CHARACTER_IMAGE_URL = "/asset/character/adam.png"
const CHARACTER_ATLAS_URL = "/asset/character/adam.json"
const PLAYER_IDLE_ANIM = "adam-idle"
const PLAYER_RUN_ANIM = "adam-run"

const TILESETS = [
  { mapName: "FloorAndGround", key: "FloorAndGround", url: "/asset/map/FloorAndGround.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "chair", key: "chair", url: "/asset/items/chair.png", tileWidth: 32, tileHeight: 64 },
  { mapName: "Modern_Office_Black_Shadow", key: "Modern_Office_Black_Shadow", url: "/asset/tileset/Modern_Office_Black_Shadow.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "Generic", key: "Generic", url: "/asset/tileset/Generic.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "computer", key: "computer", url: "/asset/items/computer.png", tileWidth: 96, tileHeight: 64 },
  { mapName: "whiteboard", key: "whiteboard", url: "/asset/items/whiteboard.png", tileWidth: 64, tileHeight: 64 },
  { mapName: "Basement", key: "Basement", url: "/asset/tileset/Basement.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "vendingmachine", key: "vendingmachine", url: "/asset/items/vendingmachine.png", tileWidth: 48, tileHeight: 72 },
] as const

const COLLIDER_LAYER_NAMES = [
  "Wall",
  "ObjectsOnCollide",
  "GenericObjectsOnCollide",
  "Chair",
  "Computer",
  "Whiteboard",
  "Basement",
  "VendingMachine",
] as const

const INTERACTABLE_LAYER_NAMES = ["Chair", "Computer", "Whiteboard", "VendingMachine"] as const

type ColliderRect = {
  x: number
  y: number
  width: number
  height: number
}

type InteractableKind = (typeof INTERACTABLE_LAYER_NAMES)[number]

type Interactable = {
  id: string
  kind: InteractableKind
  x: number
  y: number
  radius: number
  canSit: boolean
  seatX: number
  seatY: number
}

export default class MainScene extends Phaser.Scene {
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
  keys?: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  roomByTile?: Int16Array
  roomCount = 0
  currentRoomId = -1
  mapWidthInTiles = 0
  mapHeightInTiles = 0
  tileWidth = 32
  tileHeight = 32
  worldWidth = 0
  worldHeight = 0
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

  constructor() {
    super("MainScene")
  }

  preload() {
    console.log("[MainScene] preload start")
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error("MainScene asset load failed:", file.key, file.src)
    })
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      console.log("[MainScene] preload complete")
    })

    if (!this.cache.tilemap.exists(MAP_KEY)) {
      this.load.tilemapTiledJSON(MAP_KEY, MAP_URL)
    }

    for (const tileset of TILESETS) {
      if (!this.textures.exists(tileset.key)) {
        this.load.spritesheet(tileset.key, tileset.url, {
          frameWidth: tileset.tileWidth,
          frameHeight: tileset.tileHeight,
        })
      }
    }

    if (!this.textures.exists(CHARACTER_ATLAS_KEY)) {
      this.load.atlas(CHARACTER_ATLAS_KEY, CHARACTER_IMAGE_URL, CHARACTER_ATLAS_URL)
    }
  }

  private ensurePlayerAnimations() {
    if (!this.anims.exists(PLAYER_IDLE_ANIM)) {
      this.anims.create({
        key: PLAYER_IDLE_ANIM,
        frames: this.anims.generateFrameNames(CHARACTER_ATLAS_KEY, {
          prefix: "Adam_idle_anim_",
          start: 1,
          end: 24,
          suffix: ".png",
        }),
        frameRate: 10,
        repeat: -1,
      })
    }

    if (!this.anims.exists(PLAYER_RUN_ANIM)) {
      this.anims.create({
        key: PLAYER_RUN_ANIM,
        frames: this.anims.generateFrameNames(CHARACTER_ATLAS_KEY, {
          prefix: "Adam_run_",
          start: 1,
          end: 24,
          suffix: ".png",
        }),
        frameRate: 18,
        repeat: -1,
      })
    }
  }

  private getObjectTop(object: Phaser.Types.Tilemaps.TiledObject): number {
    const y = object.y ?? 0
    const height = object.height ?? 0
    return typeof object.gid === "number" ? y - height : y
  }

  private getColliderRects(map: Phaser.Tilemaps.Tilemap) {
    const rects: ColliderRect[] = []

    for (const layerName of COLLIDER_LAYER_NAMES) {
      const layer = map.getObjectLayer(layerName)
      if (!layer) continue

      for (const object of layer.objects) {
        if (object.visible === false) continue

        const width = object.width ?? map.tileWidth
        const height = object.height ?? map.tileHeight
        if (!width || !height) continue

        const x = object.x ?? 0
        const y = this.getObjectTop(object)
        rects.push({ x, y, width, height })
      }
    }

    return rects
  }

  private getTilesetTextureKey(tilesetName: string) {
    return TILESETS.find((entry) => entry.mapName === tilesetName)?.key
  }

  private renderObjectLayers(map: Phaser.Tilemaps.Tilemap) {
    let renderedCount = 0
    let skippedCount = 0

    for (const [layerIndex, objectLayer] of map.objects.entries()) {
      const layerObjects = [...objectLayer.objects].sort((a, b) => {
        const ay = this.getObjectTop(a)
        const by = this.getObjectTop(b)
        return ay - by
      })

      for (const object of layerObjects) {
        if (object.visible === false) continue
        if (typeof object.gid !== "number") continue

        const gid = object.gid
        const tileset = map.tilesets.find((entry) => entry.containsTileIndex(gid))
        if (!tileset) {
          skippedCount += 1
          continue
        }

        const textureKey = this.getTilesetTextureKey(tileset.name)
        if (!textureKey || !this.textures.exists(textureKey)) {
          skippedCount += 1
          continue
        }

        const frame = gid - tileset.firstgid
        if (frame < 0 || frame >= tileset.total) {
          skippedCount += 1
          continue
        }

        const width = object.width ?? tileset.tileWidth
        const height = object.height ?? tileset.tileHeight
        const x = object.x ?? 0
        const y = object.y ?? 0

        const sprite = this.add.image(x, y, textureKey, frame)
        sprite.setOrigin(0, 1)
        sprite.setDisplaySize(width, height)
        sprite.setDepth(y + layerIndex)
        renderedCount += 1
      }
    }

    console.log(`[MainScene] object sprites rendered: ${renderedCount}, skipped: ${skippedCount}`)
  }

  private createColliders(rects: ColliderRect[]) {
    const staticGroup = this.physics.add.staticGroup()

    for (const rect of rects) {
      const bodyRect = this.add.rectangle(
        rect.x + rect.width / 2,
        rect.y + rect.height / 2,
        rect.width,
        rect.height,
        0xff0000,
        0
      )
      this.physics.add.existing(bodyRect, true)
      staticGroup.add(bodyRect)
    }

    this.colliders = staticGroup
    console.log(`[MainScene] collider bodies created: ${rects.length}`)
  }

  private getInteractableLabel(kind: InteractableKind) {
    if (kind === "Chair") return "Chair"
    if (kind === "Computer") return "Desk"
    if (kind === "Whiteboard") return "Whiteboard"
    return "Vending Machine"
  }

  private getInteractableVerb(kind: InteractableKind) {
    if (kind === "Chair") return "Sit"
    if (kind === "Computer") return "Sit At"
    if (kind === "Whiteboard") return "Read"
    return "Buy"
  }

  private computePlayableBounds(map: Phaser.Tilemaps.Tilemap) {
    let minTileX = map.width - 1
    let minTileY = map.height - 1
    let maxTileX = 0
    let maxTileY = 0
    let hasGround = false

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const groundTile = map.getTileAt(x, y, false, "Ground")
        if (!groundTile || groundTile.index < 0) continue

        hasGround = true
        if (x < minTileX) minTileX = x
        if (y < minTileY) minTileY = y
        if (x > maxTileX) maxTileX = x
        if (y > maxTileY) maxTileY = y
      }
    }

    if (!hasGround) {
      return new Phaser.Geom.Rectangle(0, 0, map.widthInPixels, map.heightInPixels)
    }

    return new Phaser.Geom.Rectangle(
      minTileX * map.tileWidth,
      minTileY * map.tileHeight,
      (maxTileX - minTileX + 1) * map.tileWidth,
      (maxTileY - minTileY + 1) * map.tileHeight
    )
  }

  private getObjectStringProperty(object: Phaser.Types.Tilemaps.TiledObject, key: string) {
    const property = object.properties?.find((entry: { name?: string; value?: unknown }) => entry.name === key)
    const value = property?.value
    return typeof value === "string" ? value : undefined
  }

  private getSeatPosition(
    kind: InteractableKind,
    object: Phaser.Types.Tilemaps.TiledObject,
    width: number,
    height: number
  ) {
    const centerX = (object.x ?? 0) + width / 2
    const bottomY = object.y ?? 0

    if (kind === "Chair") {
      const direction = this.getObjectStringProperty(object, "direction")
      if (direction === "left") return { x: centerX - width * 0.35, y: bottomY - 6 }
      if (direction === "right") return { x: centerX + width * 0.35, y: bottomY - 6 }
      if (direction === "up") return { x: centerX, y: bottomY - height * 0.4 }
      return { x: centerX, y: bottomY + 8 }
    }

    if (kind === "Computer") {
      return { x: centerX, y: bottomY + 14 }
    }

    return { x: centerX, y: bottomY - 4 }
  }

  private buildInteractables(map: Phaser.Tilemaps.Tilemap) {
    const interactables: Interactable[] = []

    for (const layerName of INTERACTABLE_LAYER_NAMES) {
      const layer = map.getObjectLayer(layerName)
      if (!layer) continue

      for (const [index, object] of layer.objects.entries()) {
        if (object.visible === false) continue

        const width = object.width ?? map.tileWidth
        const height = object.height ?? map.tileHeight
        if (!width || !height) continue

        const x = (object.x ?? 0) + width / 2
        const y = this.getObjectTop(object) + height / 2
        const radius = Math.max(width, height) * 0.8 + 24
        const id = `${layerName}-${object.id ?? index}`
        const canSit = layerName === "Chair" || layerName === "Computer"
        const seatPosition = this.getSeatPosition(layerName, object, width, height)

        interactables.push({
          id,
          kind: layerName,
          x,
          y,
          radius,
          canSit,
          seatX: seatPosition.x,
          seatY: seatPosition.y,
        })
      }
    }

    this.interactables = interactables

    const chairs = this.interactables.filter((entry) => entry.kind === "Chair")
    for (const computer of this.interactables.filter((entry) => entry.kind === "Computer")) {
      let nearestChair: Interactable | undefined
      let nearestChairDistance = Number.POSITIVE_INFINITY

      for (const chair of chairs) {
        const distance = Phaser.Math.Distance.Between(computer.x, computer.y, chair.x, chair.y)
        if (distance > 140) continue
        if (distance >= nearestChairDistance) continue
        nearestChair = chair
        nearestChairDistance = distance
      }

      if (!nearestChair) continue
      computer.seatX = nearestChair.seatX
      computer.seatY = nearestChair.seatY
    }

    console.log(`[MainScene] interactables created: ${interactables.length}`)
  }

  private getPlayerFeetPosition() {
    if (!this.player) return undefined

    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    if (!body) {
      return {
        x: this.player.x,
        y: this.player.y,
      }
    }

    return {
      x: body.center.x,
      y: body.bottom - 1,
    }
  }

  private findNearestInteractable() {
    if (!this.interactables.length) return undefined

    const feet = this.getPlayerFeetPosition()
    if (!feet) return undefined

    let nearest: Interactable | undefined
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const interactable of this.interactables) {
      const distance = Phaser.Math.Distance.Between(feet.x, feet.y, interactable.x, interactable.y)
      if (distance > interactable.radius) continue
      if (distance >= nearestDistance) continue

      nearest = interactable
      nearestDistance = distance
    }

    return nearest
  }

  private getRoomIdAtWorld(x: number, y: number) {
    if (!this.roomByTile || this.mapWidthInTiles === 0 || this.mapHeightInTiles === 0) {
      return -1
    }

    const tileX = Phaser.Math.Clamp(Math.floor(x / this.tileWidth), 0, this.mapWidthInTiles - 1)
    const tileY = Phaser.Math.Clamp(Math.floor(y / this.tileHeight), 0, this.mapHeightInTiles - 1)
    return this.roomByTile[tileY * this.mapWidthInTiles + tileX]
  }

  private findNearestWalkablePosition(startX: number, startY: number, maxRadiusInTiles = 4) {
    if (this.getRoomIdAtWorld(startX, startY) >= 0) {
      return { x: startX, y: startY }
    }

    if (!this.roomByTile || this.mapWidthInTiles === 0 || this.mapHeightInTiles === 0) {
      return undefined
    }

    const centerTileX = Phaser.Math.Clamp(Math.floor(startX / this.tileWidth), 0, this.mapWidthInTiles - 1)
    const centerTileY = Phaser.Math.Clamp(Math.floor(startY / this.tileHeight), 0, this.mapHeightInTiles - 1)
    let best: { x: number; y: number; distanceSq: number } | undefined

    for (let radius = 1; radius <= maxRadiusInTiles; radius += 1) {
      for (let tileY = centerTileY - radius; tileY <= centerTileY + radius; tileY += 1) {
        for (let tileX = centerTileX - radius; tileX <= centerTileX + radius; tileX += 1) {
          if (tileX < 0 || tileY < 0 || tileX >= this.mapWidthInTiles || tileY >= this.mapHeightInTiles) {
            continue
          }

          const ringDistance = Math.max(Math.abs(tileX - centerTileX), Math.abs(tileY - centerTileY))
          if (ringDistance !== radius) continue

          const roomId = this.roomByTile[tileY * this.mapWidthInTiles + tileX]
          if (roomId < 0) continue

          const x = tileX * this.tileWidth + this.tileWidth / 2
          const y = tileY * this.tileHeight + this.tileHeight * 0.75
          const distanceSq = Phaser.Math.Distance.Squared(startX, startY, x, y)

          if (!best || distanceSq < best.distanceSq) {
            best = { x, y, distanceSq }
          }
        }
      }

      if (best) {
        return { x: best.x, y: best.y }
      }
    }

    return undefined
  }

  private setPlayerCollisionEnabled(enabled: boolean) {
    if (!this.player) return
    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    if (!body) return

    body.checkCollision.none = !enabled
  }

  private sitAtInteractable(interactable: Interactable) {
    if (!this.player) return

    this.preSeatX = this.player.x
    this.preSeatY = this.player.y

    const snappedSeat =
      this.findNearestWalkablePosition(interactable.seatX, interactable.seatY, 3) ??
      { x: interactable.seatX, y: interactable.seatY }

    this.isSeated = true
    this.seatedInteractable = interactable
    this.player.setVelocity(0, 0)
    this.player.setPosition(snappedSeat.x, snappedSeat.y)
    this.player.setFrame("Adam_sit_down.png")
    this.setPlayerCollisionEnabled(false)
  }

  private standUpFromSeat() {
    if (!this.player || !this.isSeated) return

    this.isSeated = false
    this.setPlayerCollisionEnabled(true)

    const baseX = this.seatedInteractable?.seatX ?? this.player.x
    const baseY = this.seatedInteractable?.seatY ?? this.player.y
    const preferredExitX = baseX
    const preferredExitY = baseY + this.tileHeight * 0.9

    const standPosition =
      this.findNearestWalkablePosition(this.preSeatX, this.preSeatY, 6) ??
      this.findNearestWalkablePosition(preferredExitX, preferredExitY, 4) ??
      this.findNearestWalkablePosition(this.player.x, this.player.y, 8) ??
      this.findNearestWalkablePosition(this.lastSafeX, this.lastSafeY, 5) ??
      { x: this.lastSafeX, y: this.lastSafeY }

    this.player.setPosition(standPosition.x, standPosition.y)
    this.player.setVelocity(0, 0)
    this.player.play(PLAYER_IDLE_ANIM, true)
    this.lastSafeX = standPosition.x
    this.lastSafeY = standPosition.y
    this.seatedInteractable = undefined
  }

  private rescueIfEmbedded() {
    if (!this.player) return

    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    if (!body || !body.embedded) return

    this.isSeated = false
    this.seatedInteractable = undefined
    this.setPlayerCollisionEnabled(true)

    const rescue =
      this.findNearestWalkablePosition(this.lastSafeX, this.lastSafeY, 8) ??
      this.findNearestWalkablePosition(this.player.x, this.player.y, 10) ??
      this.findSpawnPoint()

    this.player.setPosition(rescue.x, rescue.y)
    body.reset(rescue.x, rescue.y)
    this.player.play(PLAYER_IDLE_ANIM, true)
    this.lastSafeX = rescue.x
    this.lastSafeY = rescue.y
    this.showInteractionStatus("Adjusted position")
  }

  private updateInteractionPrompt() {
    if (!this.interactionPrompt) return

    if (this.isSeated) {
      this.interactionPrompt.setText("[E] Stand Up")
      this.interactionPrompt.setVisible(true)
      return
    }

    const nearest = this.findNearestInteractable()
    this.activeInteractable = nearest

    if (!nearest) {
      this.interactionPrompt.setVisible(false)
      return
    }

    const verb = this.getInteractableVerb(nearest.kind)
    const label = this.getInteractableLabel(nearest.kind)
    this.interactionPrompt.setText(`[E] ${verb} ${label}`)
    this.interactionPrompt.setVisible(true)
  }

  private showInteractionStatus(message: string) {
    if (!this.interactionStatus) return

    this.interactionStatus.setText(message)
    this.interactionStatus.setVisible(true)
    this.interactionStatusTimer?.remove(false)
    this.interactionStatusTimer = this.time.delayedCall(1800, () => {
      this.interactionStatus?.setVisible(false)
    })
  }

  private handleInteraction() {
    if (!this.player) return

    if (this.isSeated) {
      this.standUpFromSeat()
      this.showInteractionStatus("Stood up")
      return
    }

    if (!this.activeInteractable) return

    const label = this.getInteractableLabel(this.activeInteractable.kind)
    if (this.activeInteractable.canSit) {
      this.sitAtInteractable(this.activeInteractable)
      this.showInteractionStatus(`Sitting at ${label}`)
      return
    }

    if (this.activeInteractable.kind === "Computer") {
      this.showInteractionStatus(`Using ${label}`)
      return
    }

    if (this.activeInteractable.kind === "Whiteboard") {
      this.showInteractionStatus(`Reading ${label}`)
      return
    }

    this.showInteractionStatus("Bought a snack")
  }

  private markBlockedTiles(map: Phaser.Tilemaps.Tilemap, rects: ColliderRect[]) {
    const blocked = new Uint8Array(map.width * map.height)

    // Tiles that are empty on the ground layer are outside playable rooms.
    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const groundTile = map.getTileAt(x, y, false, "Ground")
        if (groundTile && groundTile.index >= 0) continue

        blocked[y * map.width + x] = 1
      }
    }

    for (const rect of rects) {
      const startX = Phaser.Math.Clamp(Math.floor(rect.x / map.tileWidth), 0, map.width - 1)
      const startY = Phaser.Math.Clamp(Math.floor(rect.y / map.tileHeight), 0, map.height - 1)
      const endX = Phaser.Math.Clamp(Math.ceil((rect.x + rect.width) / map.tileWidth) - 1, 0, map.width - 1)
      const endY = Phaser.Math.Clamp(Math.ceil((rect.y + rect.height) / map.tileHeight) - 1, 0, map.height - 1)

      for (let y = startY; y <= endY; y += 1) {
        for (let x = startX; x <= endX; x += 1) {
          blocked[y * map.width + x] = 1
        }
      }
    }

    return blocked
  }

  private buildRooms(map: Phaser.Tilemaps.Tilemap, blocked: Uint8Array) {
    const roomByTile = new Int16Array(map.width * map.height)
    roomByTile.fill(-1)

    const queueX: number[] = []
    const queueY: number[] = []
    let roomId = 0

    const explore = (startX: number, startY: number) => {
      queueX.length = 0
      queueY.length = 0
      queueX.push(startX)
      queueY.push(startY)
      roomByTile[startY * map.width + startX] = roomId

      let readIndex = 0
      while (readIndex < queueX.length) {
        const x = queueX[readIndex]
        const y = queueY[readIndex]
        readIndex += 1

        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ]

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue

          const index = ny * map.width + nx
          if (blocked[index]) continue
          if (roomByTile[index] !== -1) continue

          roomByTile[index] = roomId
          queueX.push(nx)
          queueY.push(ny)
        }
      }
    }

    for (let y = 0; y < map.height; y += 1) {
      for (let x = 0; x < map.width; x += 1) {
        const index = y * map.width + x
        if (blocked[index]) continue
        if (roomByTile[index] !== -1) continue

        explore(x, y)
        roomId += 1
      }
    }

    this.roomByTile = roomByTile
    this.roomCount = roomId
    this.mapWidthInTiles = map.width
    this.mapHeightInTiles = map.height
    this.tileWidth = map.tileWidth
    this.tileHeight = map.tileHeight
    console.log(`[MainScene] rooms computed: ${roomId}`)
  }

  private findSpawnPoint() {
    const centerX = Math.floor(this.mapWidthInTiles / 2)
    const centerY = Math.floor(this.mapHeightInTiles / 2)

    let bestTileX = centerX
    let bestTileY = centerY
    let bestDistance = Number.POSITIVE_INFINITY

    if (!this.roomByTile) {
      return {
        x: centerX * this.tileWidth + this.tileWidth / 2,
        y: centerY * this.tileHeight + this.tileHeight * 0.75,
      }
    }

    for (let y = 0; y < this.mapHeightInTiles; y += 1) {
      for (let x = 0; x < this.mapWidthInTiles; x += 1) {
        const index = y * this.mapWidthInTiles + x
        if (this.roomByTile[index] < 0) continue

        const distance = Math.abs(centerX - x) + Math.abs(centerY - y)
        if (distance >= bestDistance) continue

        bestDistance = distance
        bestTileX = x
        bestTileY = y
      }
    }

    return {
      x: bestTileX * this.tileWidth + this.tileWidth / 2,
      y: bestTileY * this.tileHeight + this.tileHeight * 0.75,
    }
  }

  private applyRoomLogic() {
    if (!this.player || !this.roomByTile || !this.roomLabel) return

    const body = this.player.body as Phaser.Physics.Arcade.Body | undefined
    const footX = body ? body.center.x : this.player.x
    const footY = body ? body.bottom - 1 : this.player.y

    const tileX = Phaser.Math.Clamp(Math.floor(footX / this.tileWidth), 0, this.mapWidthInTiles - 1)
    const tileY = Phaser.Math.Clamp(Math.floor(footY / this.tileHeight), 0, this.mapHeightInTiles - 1)
    const roomId = this.roomByTile[tileY * this.mapWidthInTiles + tileX]

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

  private clampPlayerSpriteToWorld() {
    if (!this.player) return

    const minX = this.worldMinX + this.player.displayWidth * this.player.originX
    const maxX = this.worldMaxX - this.player.displayWidth * (1 - this.player.originX)
    const minY = this.worldMinY + this.player.displayHeight * this.player.originY
    const maxY = this.worldMaxY - this.player.displayHeight * (1 - this.player.originY)

    this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX)
    this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY)
  }

  private updateCameraMotion(vx: number, vy: number) {
    const moving = vx !== 0 || vy !== 0
    const targetZoom = this.isSeated ? 1.52 : moving ? 1.48 : 1.44
    const targetLookX = this.isSeated ? 0 : Phaser.Math.Clamp(vx / 200, -1, 1) * 44
    const targetLookY = this.isSeated ? 0 : Phaser.Math.Clamp(vy / 200, -1, 1) * 28

    this.cameraLookX = Phaser.Math.Linear(this.cameraLookX, targetLookX, 0.12)
    this.cameraLookY = Phaser.Math.Linear(this.cameraLookY, targetLookY, 0.12)
    this.cameras.main.setFollowOffset(this.cameraLookX, this.cameraLookY)
    this.cameras.main.setZoom(Phaser.Math.Linear(this.cameras.main.zoom, targetZoom, 0.08))
  }

  private emitPlayerState(force = false) {
    if (!this.player || typeof window === "undefined") return

    const now = this.time.now
    const x = Math.round(this.player.x)
    const y = Math.round(this.player.y)
    const roomId = Number.isFinite(this.currentRoomId) ? this.currentRoomId : -1

    const movedEnough =
      !Number.isFinite(this.lastStateEmitX) ||
      Math.abs(x - this.lastStateEmitX) >= 2 ||
      Math.abs(y - this.lastStateEmitY) >= 2
    const roomChanged = roomId !== this.lastStateEmitRoom
    const throttled = now - this.lastStateEmitAt < 80

    if (!force && !roomChanged && (!movedEnough || throttled)) return

    this.lastStateEmitX = x
    this.lastStateEmitY = y
    this.lastStateEmitRoom = roomId
    this.lastStateEmitAt = now

    window.dispatchEvent(
      new CustomEvent("twodverse:player-state", {
        detail: { x, y, roomId },
      })
    )
  }

  create() {
    console.log("[MainScene] create start")
    this.cameras.main.setBackgroundColor("#1e1e1e")
    this.ensurePlayerAnimations()

    const map = this.make.tilemap({ key: MAP_KEY })
    const mapTilesets = TILESETS
      .map((tileset) => map.addTilesetImage(tileset.mapName, tileset.key))
      .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset))

    if (mapTilesets.length === 0) {
      console.error("No tilesets could be bound for /asset/map/map.json")
      return
    }
    console.log(`[MainScene] tilesets bound: ${mapTilesets.length}`)

    const candidateLayerNames = map.layers.map((layerData) => layerData.name)
    let renderedLayerCount = 0

    for (const layerName of candidateLayerNames) {
      const created = map.createLayer(layerName, mapTilesets)
      if (!created) continue
      created.setDepth(renderedLayerCount)
      renderedLayerCount += 1
    }

    console.log(`[MainScene] tile layers rendered: ${renderedLayerCount}`)
    this.renderObjectLayers(map)

    const playBounds = this.computePlayableBounds(map)
    this.worldMinX = playBounds.x
    this.worldMinY = playBounds.y
    this.worldWidth = playBounds.width
    this.worldHeight = playBounds.height
    this.worldMaxX = this.worldMinX + this.worldWidth
    this.worldMaxY = this.worldMinY + this.worldHeight
    this.physics.world.setBounds(this.worldMinX, this.worldMinY, this.worldWidth, this.worldHeight)
    this.cameras.main.setBounds(this.worldMinX, this.worldMinY, this.worldWidth, this.worldHeight)

    const colliderRects = this.getColliderRects(map)
    this.createColliders(colliderRects)
    const blockedTiles = this.markBlockedTiles(map, colliderRects)
    this.buildRooms(map, blockedTiles)
    this.buildInteractables(map)

    const spawn = this.findSpawnPoint()
    this.player = this.physics.add.sprite(spawn.x, spawn.y, CHARACTER_ATLAS_KEY, "Adam_idle_anim_1.png")
    this.player.setOrigin(0.5, 1)
    this.player.setSize(18, 20)
    this.player.setOffset(7, 28)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(spawn.y + 100)
    this.player.play(PLAYER_IDLE_ANIM)
    this.lastSafeX = spawn.x
    this.lastSafeY = spawn.y

    if (this.colliders) {
      this.physics.add.collider(this.player, this.colliders)
    }

    this.cameras.main.startFollow(this.player, true, 1, 1)
    this.cameras.main.setDeadzone(0, 0)
    this.cameras.main.setZoom(1.45)
    this.cameras.main.roundPixels = true
    this.cameras.main.setFollowOffset(0, 0)

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as
      | {
          W: Phaser.Input.Keyboard.Key
          A: Phaser.Input.Keyboard.Key
          S: Phaser.Input.Keyboard.Key
          D: Phaser.Input.Keyboard.Key
        }
      | undefined
    this.interactKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E)

    this.roomLabel = this.add
      .text(16, 16, "Room: --", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#e2e8f0",
        backgroundColor: "#02061799",
        padding: { x: 8, y: 4 },
      })
      .setDepth(1200)
      .setScrollFactor(0)

    this.interactionPrompt = this.add
      .text(16, 44, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#f8fafc",
        backgroundColor: "#0f172aa6",
        padding: { x: 8, y: 4 },
      })
      .setDepth(1200)
      .setScrollFactor(0)
      .setVisible(false)

    this.interactionStatus = this.add
      .text(16, 72, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#fde68a",
        backgroundColor: "#451a03b0",
        padding: { x: 8, y: 4 },
      })
      .setDepth(1200)
      .setScrollFactor(0)
      .setVisible(false)

    this.applyRoomLogic()
    this.updateInteractionPrompt()
    this.emitPlayerState(true)
  }

  update() {
    if (!this.cursors || !this.keys || !this.player) return

    const speed = 200
    let vx = 0
    let vy = 0

    if (this.cursors.left?.isDown || this.keys?.A?.isDown) vx = -speed
    else if (this.cursors.right?.isDown || this.keys?.D?.isDown) vx = speed

    if (this.cursors.up?.isDown || this.keys?.W?.isDown) vy = -speed
    else if (this.cursors.down?.isDown || this.keys?.S?.isDown) vy = speed

    const wantsToMove = vx !== 0 || vy !== 0
    if (this.isSeated && wantsToMove) {
      this.standUpFromSeat()
      this.showInteractionStatus("Stood up")
    }

    if (this.isSeated) {
      this.player.setVelocity(0, 0)
      this.player.setFrame("Adam_sit_down.png")
    } else {
      this.player.setVelocity(vx, vy)

      if (vx !== 0 || vy !== 0) {
        this.player.body.velocity.normalize().scale(speed)
        this.player.play(PLAYER_RUN_ANIM, true)
        if (vx < 0) this.player.setFlipX(true)
        if (vx > 0) this.player.setFlipX(false)
      } else {
        this.player.play(PLAYER_IDLE_ANIM, true)
      }
    }

    this.clampPlayerSpriteToWorld()
    this.updateCameraMotion(vx, vy)
    this.player.setDepth(this.player.y + 100)
    this.applyRoomLogic()
    this.rescueIfEmbedded()
    this.emitPlayerState()
    this.updateInteractionPrompt()

    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.handleInteraction()
    }
  }
}
