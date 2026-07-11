/**
 * map-data.ts
 * Static map layout: room definitions, furniture placements, NPC positions.
 * All coordinates are in tile units (1 tile = 48px).
 */

export const TILE_SIZE = 48
export const MAP_COLS = 36
export const MAP_ROWS = 24

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

export const ROOMS: RoomDef[] = [
  { id: "engineering", label: "Engineering", xpTag: "+10 XP/hr", col: 1, row: 2, cols: 10, rows: 8, color: 0x4a78c8 },
  { id: "warroom",     label: "War Room",    xpTag: "+5 XP/hr",  col: 13, row: 2, cols: 10, rows: 8, color: 0xc84a4a },
  { id: "lounge",      label: "Lounge",      xpTag: "Daily trivia", col: 1, row: 13, cols: 10, rows: 9, color: 0x4ac878 },
  { id: "kitchen",     label: "Kitchen",     xpTag: "Coffee ☕ x2", col: 13, row: 13, cols: 10, rows: 9, color: 0xc8a84a },
  { id: "hallway",     label: "Hallway",     xpTag: "",           col: 0, row: 0, cols: 36, rows: 2, color: 0x888888 },
]

export type FurnitureDef = {
  key: string          // sprite name under /_godot/assets/furniture/<theme>/<key>.png
  col: number
  row: number
  anchorX?: number     // 0..1, default 0.5
  anchorY?: number     // 0..1, default 1  (bottom-aligned for z-sort)
  scale?: number
}

export const FURNITURE_LAYOUT: FurnitureDef[] = [
  // Engineering room — desks + PCs + chairs
  { key: "desk",       col: 2,  row: 4,  scale: 1.4 },
  { key: "pc",         col: 2,  row: 3,  scale: 1.2 },
  { key: "chair",      col: 2,  row: 5 },
  { key: "desk",       col: 5,  row: 4,  scale: 1.4 },
  { key: "laptop",     col: 5,  row: 3,  scale: 1.2 },
  { key: "chair",      col: 5,  row: 5 },
  { key: "desk",       col: 8,  row: 4,  scale: 1.4 },
  { key: "pc",         col: 8,  row: 3,  scale: 1.2 },
  { key: "chair",      col: 8,  row: 5 },
  { key: "bookshelf",  col: 10, row: 3,  scale: 1.1 },
  { key: "plant",      col: 1,  row: 8 },
  { key: "trash_bin",  col: 10, row: 8,  scale: 0.9 },

  // War room — meeting table + whiteboard + projector
  { key: "meeting_table", col: 16, row: 5, scale: 1.6 },
  { key: "chair",          col: 14, row: 5 },
  { key: "chair",          col: 14, row: 7 },
  { key: "chair",          col: 20, row: 5 },
  { key: "chair",          col: 20, row: 7 },
  { key: "whiteboard",     col: 15, row: 2, scale: 1.3 },
  { key: "projector_screen", col: 20, row: 2, scale: 1.3 },
  { key: "projector",      col: 22, row: 8, scale: 1.0 },
  { key: "wall_clock",     col: 13, row: 2, scale: 1.0 },

  // Lounge — sofa + rug + lamps
  { key: "rug",        col: 3,  row: 15, scale: 1.5 },
  { key: "sofa",       col: 2,  row: 14, scale: 1.4 },
  { key: "floor_lamp", col: 7,  row: 14, scale: 1.1 },
  { key: "koi_pond",   col: 4,  row: 17, scale: 1.4 },
  { key: "bonsai_a",   col: 1,  row: 21 },
  { key: "bonsai_b",   col: 10, row: 21 },
  { key: "painting",   col: 1,  row: 13, scale: 1.0 },

  // Kitchen — fridge + coffee + water cooler
  { key: "fridge",         col: 14, row: 14, scale: 1.1 },
  { key: "coffee_machine", col: 16, row: 14, scale: 1.1 },
  { key: "water_cooler",   col: 18, row: 14, scale: 1.1 },
  { key: "trash_bin",      col: 22, row: 21, scale: 0.9 },
  { key: "plant",          col: 13, row: 21 },

  // Hallway — doors + clock
  { key: "door",       col: 11, row: 0, scale: 1.0 },
  { key: "door",       col: 24, row: 0, scale: 1.0 },
  { key: "wall_clock", col: 18, row: 0 },
]

export type NpcDef = {
  name: string
  char: string    // character filename prefix e.g. "luffy"
  col: number
  row: number
  greeting: string
  level: number
}

export const NPCS: NpcDef[] = [
  { name: "Luffy",   char: "luffy",   col: 6,  row: 6,  greeting: "Standup in 5! 🔔", level: 12 },
  { name: "Nami",    char: "nami",    col: 3,  row: 16, greeting: "☕ Coffee time~",   level: 9  },
  { name: "Zoro",    char: "zoro",    col: 17, row: 6,  greeting: "Focus mode 🔕",     level: 15 },
  { name: "Sanji",   char: "sanji",   col: 19, row: 16, greeting: "Lunch is ready! 🍳", level: 11 },
  { name: "Robin",   char: "robin",   col: 9,  row: 4,  greeting: "Reading docs…",    level: 14 },
  { name: "Brook",   char: "brook",   col: 15, row: 7,  greeting: "YOHOHO! 💀",        level: 8  },
  { name: "Chopper", char: "chopper", col: 4,  row: 19, greeting: "Woof! 🐾",          level: 5  },
  { name: "Usopp",   char: "usopp",   col: 21, row: 5,  greeting: "Presenting now!", level: 7  },
]
