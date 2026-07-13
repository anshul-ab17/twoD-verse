/**
 * map-data.ts
 * Constants for the SkyOffice Tiled map (public/skyoffice/map.json, 40x30
 * tiles of 32px) plus room labels and decorative NPC placements. Furniture
 * comes from the Tiled map itself (TiledMapLayer), not from code.
 */

export const TILE_SIZE = 32
export const MAP_COLS = 40
export const MAP_ROWS = 30

export type RoomDef = {
  id: string
  label: string
  xpTag: string
  col: number
  row: number
  cols: number
  rows: number
  color: number // fill tint for room badge
}

// Rough rectangles over the SkyOffice map areas — HUD labels + first-visit XP
// toasts only; media zones are the server's SPIKE_ZONES.
export const ROOMS: RoomDef[] = [
  { id: "lounge", label: "Lounge", xpTag: "+10 XP first visit", col: 6, row: 17, cols: 12, rows: 9, color: 0x4ac878 },
  { id: "meeting", label: "Meeting Rooms", xpTag: "+10 XP first visit", col: 28, row: 13, cols: 12, rows: 15, color: 0xc84a4a },
  { id: "break", label: "Break Area", xpTag: "Coffee x2", col: 9, row: 3, cols: 9, rows: 7, color: 0xc8a84a },
  { id: "desks", label: "Open Desks", xpTag: "+10 XP/hr", col: 5, row: 11, cols: 16, rows: 5, color: 0x4a78c8 },
]

export type NpcDef = {
  name: string
  char: string // character filename prefix e.g. "luffy"
  col: number
  row: number
  greeting: string
  level: number
}

export const NPCS: NpcDef[] = [
  { name: "Luffy", char: "luffy", col: 15, row: 14, greeting: "Standup in 5!", level: 12 },
  { name: "Nami", char: "nami", col: 10, row: 20, greeting: "Coffee time~", level: 9 },
  { name: "Zoro", char: "zoro", col: 31, row: 17, greeting: "Focus mode.", level: 15 },
  { name: "Sanji", char: "sanji", col: 12, row: 7, greeting: "Lunch is ready!", level: 11 },
  { name: "Robin", char: "robin", col: 25, row: 5, greeting: "Reading docs...", level: 14 },
  { name: "Brook", char: "brook", col: 20, row: 24, greeting: "YOHOHO!", level: 8 },
  { name: "Chopper", char: "chopper", col: 4, row: 8, greeting: "Need a checkup?", level: 5 },
  { name: "Usopp", char: "usopp", col: 34, row: 27, greeting: "Presenting now!", level: 7 },
]
