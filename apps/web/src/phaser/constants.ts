export const MAP_KEY = "workspace-map"
export const MAP_URL = "/asset/map/map.json"

export const CHAR_KEYS = ["adam", "ash", "lucy", "nancy"] as const

export const CHAR_CONFIGS = {
  adam: {
    imageUrl: "/asset/character/adam.png",
    atlasUrl: "/asset/character/adam.json",
    idlePrefix: "Adam_idle_anim_",
    runPrefix: "Adam_run_",
    sitFrame: "Adam_sit_down.png",
  },
  ash: {
    imageUrl: "/asset/character/ash.png",
    atlasUrl: "/asset/character/ash.json",
    idlePrefix: "Ash_idle_anim_",
    runPrefix: "Ash_run_",
    sitFrame: "Ash_sit_down.png",
  },
  lucy: {
    imageUrl: "/asset/character/lucy.png",
    atlasUrl: "/asset/character/lucy.json",
    idlePrefix: "Lucy_idle_anim_",
    runPrefix: "Lucy_run_",
    sitFrame: "Lucy_sit_down.png",
  },
  nancy: {
    imageUrl: "/asset/character/nancy.png",
    atlasUrl: "/asset/character/nancy.json",
    idlePrefix: "Nancy_idle_anim_",
    runPrefix: "Nancy_run_",
    sitFrame: "Nancy_sit_down.png",
  },
} as const

export const THEME_BG: Record<string, string> = {
  woody: "#1e1e1e",
  neon: "#0a0015",
  forest: "#0a1a0a",
  corporate: "#0f1520",
  midnight: "#08080f",
}

export const TILESETS = [
  { mapName: "FloorAndGround", key: "FloorAndGround", url: "/asset/map/FloorAndGround.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "chair", key: "chair", url: "/asset/items/chair.png", tileWidth: 32, tileHeight: 64 },
  { mapName: "Modern_Office_Black_Shadow", key: "Modern_Office_Black_Shadow", url: "/asset/tileset/Modern_Office_Black_Shadow.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "Generic", key: "Generic", url: "/asset/tileset/Generic.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "computer", key: "computer", url: "/asset/items/computer.png", tileWidth: 96, tileHeight: 64 },
  { mapName: "whiteboard", key: "whiteboard", url: "/asset/items/whiteboard.png", tileWidth: 64, tileHeight: 64 },
  { mapName: "Basement", key: "Basement", url: "/asset/tileset/Basement.png", tileWidth: 32, tileHeight: 32 },
  { mapName: "vendingmachine", key: "vendingmachine", url: "/asset/items/vendingmachine.png", tileWidth: 48, tileHeight: 72 },
] as const

export const COLLIDER_LAYER_NAMES = [
  "Wall",
  "ObjectsOnCollide",
  "GenericObjectsOnCollide",
  "Chair",
  "Computer",
  "Whiteboard",
  "Basement",
  "VendingMachine",
] as const

export const INTERACTABLE_LAYER_NAMES = ["Chair", "Computer", "Whiteboard", "VendingMachine"] as const
