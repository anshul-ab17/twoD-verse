import type Phaser from "phaser"
import type { CHAR_KEYS, INTERACTABLE_LAYER_NAMES } from "./constants"

export type CharKey = (typeof CHAR_KEYS)[number]
export type InteractableKind = (typeof INTERACTABLE_LAYER_NAMES)[number]

export type ColliderRect = {
  x: number
  y: number
  width: number
  height: number
}

export type Interactable = {
  id: string
  kind: InteractableKind
  x: number
  y: number
  radius: number
  canSit: boolean
  seatX: number
  seatY: number
}

export type RealtimePlayer = {
  userId: string
  x: number
  y: number
  roomId: number | null
}

export type RemoteAvatar = {
  userId: string
  sprite: Phaser.GameObjects.Sprite
  label: Phaser.GameObjects.Text
  targetX: number
  targetY: number
}

export type RoomData = {
  roomByTile: Int16Array
  roomCount: number
  mapWidthInTiles: number
  mapHeightInTiles: number
  tileWidth: number
  tileHeight: number
}
