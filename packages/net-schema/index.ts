import { Schema, MapSchema, type } from "@colyseus/schema"

// --- movement constants ---
export const TICK_RATE = 20 // server simulation ticks per second
export const MOVE_SPEED = 200 // px per second
export const WORLD = { width: 1600, height: 1200 } as const

// --- message types (client -> server) ---
export const MSG = {
  /** payload: { dx: number, dy: number } each in -1..1; applied until replaced */
  MOVE: "move",
} as const

export type MoveInput = { dx: number; dy: number }

// --- state schema (shared client/server) ---
export class PlayerState extends Schema {
  @type("string") id = "" // sessionId
  @type("number") x = 0
  @type("number") y = 0
  @type("string") dir = "down"
}

export class WorldRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
}

export * from "./interpolate"
