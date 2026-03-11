import Phaser from "phaser"
import { INTERACTABLE_LAYER_NAMES } from "../constants"
import type { Interactable, InteractableKind } from "../types"
import { getObjectTop } from "./mapSetup"

function getObjectStringProperty(
  object: Phaser.Types.Tilemaps.TiledObject,
  key: string,
): string | undefined {
  const prop = object.properties?.find((p: { name?: string; value?: unknown }) => p.name === key)
  return typeof prop?.value === "string" ? prop.value : undefined
}

function getSeatPosition(
  kind: InteractableKind,
  object: Phaser.Types.Tilemaps.TiledObject,
  width: number,
  height: number,
) {
  const centerX = (object.x ?? 0) + width / 2
  const bottomY = object.y ?? 0

  if (kind === "Chair") {
    const dir = getObjectStringProperty(object, "direction")
    if (dir === "left")  return { x: centerX - width * 0.35, y: bottomY - 6 }
    if (dir === "right") return { x: centerX + width * 0.35, y: bottomY - 6 }
    if (dir === "up")    return { x: centerX, y: bottomY - height * 0.4 }
    return { x: centerX, y: bottomY + 8 }
  }

  if (kind === "Computer") return { x: centerX, y: bottomY + 14 }
  return { x: centerX, y: bottomY - 4 }
}

export function buildInteractables(map: Phaser.Tilemaps.Tilemap): Interactable[] {
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
      const y = getObjectTop(object) + height / 2
      const seat = getSeatPosition(layerName, object, width, height)

      interactables.push({
        id: `${layerName}-${object.id ?? index}`,
        kind: layerName,
        x, y,
        radius: Math.max(width, height) * 0.8 + 24,
        canSit: layerName === "Chair" || layerName === "Computer",
        seatX: seat.x,
        seatY: seat.y,
      })
    }
  }

  const chairs = interactables.filter((i) => i.kind === "Chair")
  for (const computer of interactables.filter((i) => i.kind === "Computer")) {
    let nearest: Interactable | undefined
    let nearestDist = Infinity
    for (const chair of chairs) {
      const d = Phaser.Math.Distance.Between(computer.x, computer.y, chair.x, chair.y)
      if (d > 140 || d >= nearestDist) continue
      nearest = chair
      nearestDist = d
    }
    if (nearest) {
      computer.seatX = nearest.seatX
      computer.seatY = nearest.seatY
    }
  }

  return interactables
}

export function findNearestInteractable(
  interactables: Interactable[],
  feetX: number,
  feetY: number,
): Interactable | undefined {
  let nearest: Interactable | undefined
  let nearestDist = Infinity

  for (const item of interactables) {
    const d = Phaser.Math.Distance.Between(feetX, feetY, item.x, item.y)
    if (d > item.radius || d >= nearestDist) continue
    nearest = item
    nearestDist = d
  }

  return nearest
}

export function getInteractableLabel(kind: InteractableKind): string {
  if (kind === "Chair") return "Chair"
  if (kind === "Computer") return "Desk"
  if (kind === "Whiteboard") return "Whiteboard"
  return "Vending Machine"
}

export function getInteractableVerb(kind: InteractableKind): string {
  if (kind === "Chair") return "Sit"
  if (kind === "Computer") return "Sit At"
  if (kind === "Whiteboard") return "Read"
  return "Buy"
}
