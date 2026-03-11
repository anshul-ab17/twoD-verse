import Phaser from "phaser"
import { TILESETS, COLLIDER_LAYER_NAMES } from "../constants"
import type { ColliderRect } from "../types"

export function getObjectTop(object: Phaser.Types.Tilemaps.TiledObject): number {
  const y = object.y ?? 0
  const height = object.height ?? 0
  return typeof object.gid === "number" ? y - height : y
}

export function getTilesetTextureKey(name: string): string | undefined {
  return TILESETS.find((t) => t.mapName === name)?.key
}

export function getColliderRects(map: Phaser.Tilemaps.Tilemap): ColliderRect[] {
  const rects: ColliderRect[] = []

  for (const layerName of COLLIDER_LAYER_NAMES) {
    const layer = map.getObjectLayer(layerName)
    if (!layer) continue

    for (const object of layer.objects) {
      if (object.visible === false) continue
      const width = object.width ?? map.tileWidth
      const height = object.height ?? map.tileHeight
      if (!width || !height) continue
      rects.push({ x: object.x ?? 0, y: getObjectTop(object), width, height })
    }
  }

  return rects
}

export function computePlayableBounds(map: Phaser.Tilemaps.Tilemap): Phaser.Geom.Rectangle {
  let minTileX = map.width - 1
  let minTileY = map.height - 1
  let maxTileX = 0
  let maxTileY = 0
  let hasGround = false

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.getTileAt(x, y, false, "Ground")
      if (!tile || tile.index < 0) continue
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
    (maxTileY - minTileY + 1) * map.tileHeight,
  )
}

export function renderObjectLayers(scene: Phaser.Scene, map: Phaser.Tilemaps.Tilemap): void {
  let rendered = 0
  let skipped = 0

  for (const [layerIndex, objectLayer] of map.objects.entries()) {
    const sorted = [...objectLayer.objects].sort((a, b) => getObjectTop(a) - getObjectTop(b))

    for (const object of sorted) {
      if (object.visible === false || typeof object.gid !== "number") continue

      const gid = object.gid
      const tileset = map.tilesets.find((t) => t.containsTileIndex(gid))
      if (!tileset) { skipped++; continue }

      const textureKey = getTilesetTextureKey(tileset.name)
      if (!textureKey || !scene.textures.exists(textureKey)) { skipped++; continue }

      const frame = gid - tileset.firstgid
      if (frame < 0 || frame >= tileset.total) { skipped++; continue }

      const width = object.width ?? tileset.tileWidth
      const height = object.height ?? tileset.tileHeight
      const sprite = scene.add.image(object.x ?? 0, object.y ?? 0, textureKey, frame)
      sprite.setOrigin(0, 1)
      sprite.setDisplaySize(width, height)
      sprite.setDepth((object.y ?? 0) + layerIndex)
      rendered++
    }
  }

  console.log(`[MainScene] objects rendered: ${rendered}, skipped: ${skipped}`)
}

export function createColliders(
  scene: Phaser.Scene,
  rects: ColliderRect[],
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup()

  for (const rect of rects) {
    const body = scene.add.rectangle(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
      rect.width,
      rect.height,
      0xff0000,
      0,
    )
    scene.physics.add.existing(body, true)
    group.add(body)
  }

  return group
}
