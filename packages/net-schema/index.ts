import { Schema, MapSchema, type } from "@colyseus/schema"

// --- movement constants ---
export const TICK_RATE = 20 // server simulation ticks per second
export const MOVE_SPEED = 200 // px per second
export const WORLD = { width: 1600, height: 1200 } as const

// --- message types (client -> server) ---
export const MSG = {
  /** payload: { dx: number, dy: number } each in -1..1; applied until replaced */
  MOVE: "move",
  /** payload: { text: string } — live chat, no persistence (plan §7) */
  CHAT: "chat",
} as const

export type MoveInput = { dx: number; dy: number }

// --- chat (server -> clients broadcast) ---
export const CHAT_BROADCAST = "chat"
export const CHAT_MAX_LEN = 500
export type ChatInput = { text: string }
export type ChatBroadcast = { from: string; text: string; ts: number }

// --- state schema (shared client/server) ---
export class PlayerState extends Schema {
  @type("string") id = "" // sessionId
  @type("number") x = 0
  @type("number") y = 0
  @type("string") dir = "down"
  @type("string") zoneId = "" // current media zone ("" = none); LiveKit room name
  @type("number") xp = 0 // server-authoritative (plan §16) — client can never grant itself xp
  @type("number") level = 1
}

/** server -> clients broadcast when a player's level increases */
export const LEVEL_UP = "level-up"
export type LevelUpBroadcast = { sessionId: string; level: number }

export class WorldRoomState extends Schema {
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
}

export * from "./interpolate"
export * from "./zones"
export * from "./xp"
