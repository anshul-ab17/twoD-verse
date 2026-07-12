import Phaser from "phaser"
import type { ColliderRect, RoomData } from "./types"

export function markBlockedTiles(map: Phaser.Tilemaps.Tilemap, rects: ColliderRect[]): Uint8Array {
  const blocked = new Uint8Array(map.width * map.height)

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

export function buildRooms(map: Phaser.Tilemaps.Tilemap, blocked: Uint8Array): RoomData {
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

      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue
        const index = ny * map.width + nx
        if (blocked[index] || roomByTile[index] !== -1) continue
        roomByTile[index] = roomId
        queueX.push(nx)
        queueY.push(ny)
      }
    }
  }

  for (let y = 0; y < map.height; y += 1) {
    for (let x = 0; x < map.width; x += 1) {
      const index = y * map.width + x
      if (blocked[index] || roomByTile[index] !== -1) continue
      explore(x, y)
      roomId += 1
    }
  }

  console.log(`[MainScene] rooms: ${roomId}`)

  return {
    roomByTile,
    roomCount: roomId,
    mapWidthInTiles: map.width,
    mapHeightInTiles: map.height,
    tileWidth: map.tileWidth,
    tileHeight: map.tileHeight,
  }
}
