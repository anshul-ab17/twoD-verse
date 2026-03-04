import Phaser from "phaser"

const MAP_KEY = "workspace-map"
const MAP_URL = "/asset/map/map.json"
const CHARACTER_ATLAS_KEY = "adam"
const CHARACTER_IMAGE_URL = "/asset/character/adam.png"
const CHARACTER_ATLAS_URL = "/asset/character/adam.json"
const PLAYER_IDLE_ANIM = "adam-idle"
const PLAYER_RUN_ANIM = "adam-run"

const TILESETS = [
  { mapName: "FloorAndGround", key: "FloorAndGround", url: "/asset/map/FloorAndGround.png" },
  { mapName: "chair", key: "chair", url: "/asset/items/chair.png" },
  { mapName: "Modern_Office_Black_Shadow", key: "Modern_Office_Black_Shadow", url: "/asset/tileset/Modern_Office_Black_Shadow.png" },
  { mapName: "Generic", key: "Generic", url: "/asset/tileset/Generic.png" },
  { mapName: "computer", key: "computer", url: "/asset/items/computer.png" },
  { mapName: "whiteboard", key: "whiteboard", url: "/asset/items/whiteboard.png" },
  { mapName: "Basement", key: "Basement", url: "/asset/tileset/Basement.png" },
  { mapName: "vendingmachine", key: "vendingmachine", url: "/asset/items/vendingmachine.png" },
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

type ColliderRect = {
  x: number
  y: number
  width: number
  height: number
}

export default class MainScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  colliders?: Phaser.Physics.Arcade.StaticGroup
  roomLabel?: Phaser.GameObjects.Text
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
  lastSafeX = 0
  lastSafeY = 0

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
        this.load.image(tileset.key, tileset.url)
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

        const textureRect = tileset.getTileTextureCoordinates(gid)
        if (!textureRect) {
          skippedCount += 1
          continue
        }

        const width = object.width ?? tileset.tileWidth
        const height = object.height ?? tileset.tileHeight
        const x = object.x ?? 0
        const y = object.y ?? 0

        const sprite = this.add.image(x, y, textureKey)
        sprite.setOrigin(0, 1)
        sprite.setCrop(textureRect.x, textureRect.y, tileset.tileWidth, tileset.tileHeight)
        sprite.setDisplaySize(width, height)
        sprite.setDepth(this.getObjectTop(object) + layerIndex + 10)
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

    const tileX = Phaser.Math.Clamp(Math.floor(this.player.x / this.tileWidth), 0, this.mapWidthInTiles - 1)
    const tileY = Phaser.Math.Clamp(Math.floor(this.player.y / this.tileHeight), 0, this.mapHeightInTiles - 1)
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

    const minX = this.player.displayWidth * this.player.originX
    const maxX = this.worldWidth - this.player.displayWidth * (1 - this.player.originX)
    const minY = this.player.displayHeight * this.player.originY
    const maxY = this.worldHeight - this.player.displayHeight * (1 - this.player.originY)

    this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX)
    this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY)
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

    this.worldWidth = map.widthInPixels
    this.worldHeight = map.heightInPixels
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight)
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight)

    const colliderRects = this.getColliderRects(map)
    this.createColliders(colliderRects)
    const blockedTiles = this.markBlockedTiles(map, colliderRects)
    this.buildRooms(map, blockedTiles)

    const spawn = this.findSpawnPoint()
    this.player = this.physics.add.sprite(spawn.x, spawn.y, CHARACTER_ATLAS_KEY, "Adam_idle_anim_1.png")
    this.player.setOrigin(0.5, 0.82)
    this.player.setSize(16, 16)
    this.player.setOffset(8, 32)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(1000)
    this.player.play(PLAYER_IDLE_ANIM)
    this.lastSafeX = spawn.x
    this.lastSafeY = spawn.y

    if (this.colliders) {
      this.physics.add.collider(this.player, this.colliders)
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.45)

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as
      | {
          W: Phaser.Input.Keyboard.Key
          A: Phaser.Input.Keyboard.Key
          S: Phaser.Input.Keyboard.Key
          D: Phaser.Input.Keyboard.Key
        }
      | undefined

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

    this.applyRoomLogic()
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

    this.player.setVelocity(vx, vy)

    if (vx !== 0 || vy !== 0) {
      this.player.body.velocity.normalize().scale(speed)
      this.player.play(PLAYER_RUN_ANIM, true)
      if (vx < 0) this.player.setFlipX(true)
      if (vx > 0) this.player.setFlipX(false)
    } else {
      this.player.play(PLAYER_IDLE_ANIM, true)
    }

    this.clampPlayerSpriteToWorld()
    this.applyRoomLogic()
  }
}
