import Phaser from "phaser"

const MAP_KEY = "workspace-map"
const MAP_URL = "/asset/map/map.json"

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

export default class MainScene extends Phaser.Scene {
  player?: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  keys?: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }

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
  }

  private ensurePlayerTexture() {
    if (this.textures.exists("player-marker")) return

    const marker = this.add.graphics()
    marker.fillStyle(0xffd60a, 1)
    marker.fillCircle(12, 12, 12)
    marker.lineStyle(2, 0x111827, 1)
    marker.strokeCircle(12, 12, 12)
    marker.generateTexture("player-marker", 24, 24)
    marker.destroy()
  }

  create() {
    console.log("[MainScene] create start")
    this.cameras.main.setBackgroundColor("#1e1e1e")
    this.ensurePlayerTexture()

    const map = this.make.tilemap({ key: MAP_KEY })
    const mapTilesets = TILESETS
      .map((tileset) => map.addTilesetImage(tileset.mapName, tileset.key))
      .filter((tileset): tileset is Phaser.Tilemaps.Tileset => Boolean(tileset))

    if (mapTilesets.length === 0) {
      console.error("No tilesets could be bound for /asset/map/map.json")
      return
    }
    console.log(`[MainScene] tilesets bound: ${mapTilesets.length}`)

    const candidateLayerNames = ["Ground", "Obj_layer1", "Obj_layer2", "Obj_layer3", "Floor", "Walls"]
    let renderedLayerCount = 0

    for (const layerName of candidateLayerNames) {
      const created = map.createLayer(layerName, mapTilesets)
      if (!created) continue
      created.setDepth(renderedLayerCount)
      renderedLayerCount += 1
    }

    console.log(`[MainScene] tile layers rendered: ${renderedLayerCount}`)

    const spawnX = Math.floor(map.widthInPixels / 2)
    const spawnY = Math.floor(map.heightInPixels / 2)
    const worldWidth = map.widthInPixels
    const worldHeight = map.heightInPixels
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight)
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight)

    this.player = this.physics.add.sprite(spawnX, spawnY, "player-marker")
    this.player.setCollideWorldBounds(true)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.5)

    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys("W,A,S,D") as
      | {
          W: Phaser.Input.Keyboard.Key
          A: Phaser.Input.Keyboard.Key
          S: Phaser.Input.Keyboard.Key
          D: Phaser.Input.Keyboard.Key
        }
      | undefined
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
    }
  }
}
