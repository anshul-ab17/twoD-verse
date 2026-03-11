import Phaser from "phaser"

export function getRoomIdAtWorld(
  roomByTile: Int16Array,
  mapW: number,
  mapH: number,
  tileW: number,
  tileH: number,
  x: number,
  y: number,
): number {
  const tileX = Phaser.Math.Clamp(Math.floor(x / tileW), 0, mapW - 1)
  const tileY = Phaser.Math.Clamp(Math.floor(y / tileH), 0, mapH - 1)
  return roomByTile[tileY * mapW + tileX]
}

export function findNearestWalkablePosition(
  roomByTile: Int16Array | undefined,
  mapW: number,
  mapH: number,
  tileW: number,
  tileH: number,
  startX: number,
  startY: number,
  maxRadius = 4,
): { x: number; y: number } | undefined {
  if (!roomByTile || mapW === 0 || mapH === 0) return undefined

  if (getRoomIdAtWorld(roomByTile, mapW, mapH, tileW, tileH, startX, startY) >= 0) {
    return { x: startX, y: startY }
  }

  const centerTileX = Phaser.Math.Clamp(Math.floor(startX / tileW), 0, mapW - 1)
  const centerTileY = Phaser.Math.Clamp(Math.floor(startY / tileH), 0, mapH - 1)
  let best: { x: number; y: number; distSq: number } | undefined

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let ty = centerTileY - radius; ty <= centerTileY + radius; ty++) {
      for (let tx = centerTileX - radius; tx <= centerTileX + radius; tx++) {
        if (tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) continue
        if (Math.max(Math.abs(tx - centerTileX), Math.abs(ty - centerTileY)) !== radius) continue
        if (roomByTile[ty * mapW + tx] < 0) continue

        const x = tx * tileW + tileW / 2
        const y = ty * tileH + tileH * 0.75
        const distSq = Phaser.Math.Distance.Squared(startX, startY, x, y)
        if (!best || distSq < best.distSq) best = { x, y, distSq }
      }
    }
    if (best) return { x: best.x, y: best.y }
  }

  return undefined
}

export function findSpawnPoint(
  roomByTile: Int16Array | undefined,
  mapW: number,
  mapH: number,
  tileW: number,
  tileH: number,
): { x: number; y: number } {
  const centerX = Math.floor(mapW / 2)
  const centerY = Math.floor(mapH / 2)

  if (!roomByTile) {
    return { x: centerX * tileW + tileW / 2, y: centerY * tileH + tileH * 0.75 }
  }

  let bestTileX = centerX
  let bestTileY = centerY
  let bestDist = Infinity

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      if (roomByTile[y * mapW + x] < 0) continue
      const d = Math.abs(centerX - x) + Math.abs(centerY - y)
      if (d >= bestDist) continue
      bestDist = d
      bestTileX = x
      bestTileY = y
    }
  }

  return { x: bestTileX * tileW + tileW / 2, y: bestTileY * tileH + tileH * 0.75 }
}
