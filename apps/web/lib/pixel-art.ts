// Owned procedural PIXEL art kit (P14, plan §27): every sprite is drawn
// pixel-by-pixel onto offscreen canvases at native resolution and wrapped in
// Pixi textures with scaleMode "nearest" — provenance in-house/owned.
// ponytail: runtime canvas generation, no atlas files; commissioned pixel art
// slots in by swapping these functions for Assets.load of a real spritesheet.

import { Texture } from "pixi.js"

/** Displayed pixels per art pixel — sprites are scaled by this in world.ts. */
export const PX = 4

export type Dir = "down" | "up" | "left" | "right"
export type AvatarFrames = Record<Dir, Texture[]>

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  return { canvas, ctx }
}

function toTexture(canvas: HTMLCanvasElement): Texture {
  const tex = Texture.from(canvas)
  tex.source.scaleMode = "nearest" // crisp pixels, never smoothed
  return tex
}

// --- avatar generator: 16x24 frames, variants keyed by userId hash ----------

const SKINS = ["#f1d3b3", "#e0ac69", "#c68642", "#8d5524"]
const HAIR_COLORS = ["#2b2b2b", "#5a3825", "#b55239", "#d9b380", "#4a4e69"]
const SHIRTS = ["#e4572e", "#29c7ac", "#f3a712", "#5b8dee", "#c74fd1", "#8bc34a"]
const PANTS = ["#3a3f58", "#4a3b2f", "#2f4a3b"]
const HAIR_STYLES = 3 // crop | sweep | long

function hashOf(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

type Variant = { skin: string; hairStyle: number; hair: string; shirt: string; pants: string }

function variantOf(userId: string): Variant {
  const h = hashOf(userId)
  // >>> not >>: h is uint32, a signed shift goes negative for h >= 2^31 and
  // a negative index reads undefined (crashed avatar creation for ~half of ids)
  return {
    skin: SKINS[h % SKINS.length]!,
    hairStyle: (h >>> 2) % HAIR_STYLES,
    hair: HAIR_COLORS[(h >>> 4) % HAIR_COLORS.length]!,
    shirt: SHIRTS[(h >>> 7) % SHIRTS.length]!,
    pants: PANTS[(h >>> 9) % PANTS.length]!,
  }
}

const AVATAR_W = 16
const AVATAR_H = 24

/** step: 0 = idle/stand, 1 = left foot forward, 2 = right foot forward. */
function drawAvatarFrame(ctx: CanvasRenderingContext2D, v: Variant, dir: Dir, step: number) {
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  }
  const side = dir === "left" || dir === "right"
  ctx.save()
  if (dir === "left") {
    // left is a mirrored right — draw once, flip here
    ctx.translate(AVATAR_W, 0)
    ctx.scale(-1, 1)
  }

  // legs (pants) — walk cycle scissors them
  const legY = 17
  if (step === 0) {
    px(5, legY, 3, 7, v.pants)
    px(9, legY, 3, 7, v.pants)
  } else {
    const fwd = step === 1 ? 5 : 9 // which leg is forward (lifted)
    const back = step === 1 ? 9 : 5
    px(fwd, legY, 3, 6, v.pants) // lifted leg, 1px shorter
    px(back, legY, 3, 7, v.pants)
  }
  // shoes
  px(5, 23, 3, 1, "#20242f")
  px(9, 23, 3, 1, "#20242f")

  // torso (shirt)
  px(4, 10, 8, 8, v.shirt)
  // arms swing opposite to legs
  const armDrop = step === 0 ? 0 : 1
  if (side) {
    px(6, 11 + armDrop, 3, 5, v.shirt) // one visible arm
    px(6, 16 + armDrop, 3, 1, v.skin) // hand
  } else {
    px(2, 11 + (step === 1 ? armDrop : 0), 2, 5, v.shirt)
    px(12, 11 + (step === 2 ? armDrop : 0), 2, 5, v.shirt)
    px(2, 16 + (step === 1 ? armDrop : 0), 2, 1, v.skin)
    px(12, 16 + (step === 2 ? armDrop : 0), 2, 1, v.skin)
  }

  // head
  px(4, 2, 8, 8, v.skin)

  // face (not on "up" — back of head)
  if (dir === "down") {
    px(6, 5, 1, 2, "#20242f")
    px(9, 5, 1, 2, "#20242f")
    px(7, 8, 2, 1, "#c98a6d") // mouth hint
  } else if (side) {
    px(9, 5, 1, 2, "#20242f") // single profile eye
  }

  // hair: 3 styles, "up" covers the whole back of the head
  const hc = v.hair
  if (dir === "up") {
    px(4, 1, 8, 6, hc)
    px(3, 2, 1, 4, hc)
    px(12, 2, 1, 4, hc)
  } else if (v.hairStyle === 0) {
    // short crop
    px(4, 1, 8, 2, hc)
    px(3, 2, 2, 3, hc)
    px(11, 2, 2, 3, hc)
  } else if (v.hairStyle === 1) {
    // side sweep — fringe drops on one side
    px(4, 1, 8, 2, hc)
    px(3, 2, 2, 3, hc)
    px(10, 2, 3, 4, hc)
  } else {
    // long — falls to the shoulders
    px(4, 1, 8, 2, hc)
    px(3, 2, 2, 9, hc)
    px(11, 2, 2, 9, hc)
  }

  ctx.restore()
}

const avatarCache = new Map<string, AvatarFrames>()

/** Deterministic per-user pixel avatar: 4 directions x [idle, stepA, idle, stepB].
 *  Feet at the bottom edge of each 16x24 frame. Sync — no loading. */
export function avatarFrames(userId: string): AvatarFrames {
  const v = variantOf(userId)
  const key = `${v.skin}:${v.hairStyle}:${v.hair}:${v.shirt}:${v.pants}`
  let frames = avatarCache.get(key)
  if (frames) return frames

  const frame = (dir: Dir, step: number) => {
    const { canvas, ctx } = makeCanvas(AVATAR_W, AVATAR_H)
    drawAvatarFrame(ctx, v, dir, step)
    return toTexture(canvas)
  }
  const dirFrames = (dir: Dir) => {
    const idle = frame(dir, 0)
    // 4-frame walk cycle from 2 unique steps: step, stand, step, stand
    return [idle, frame(dir, 1), idle, frame(dir, 2)]
  }
  frames = {
    down: dirFrames("down"),
    up: dirFrames("up"),
    left: dirFrames("left"),
    right: dirFrames("right"),
  }
  avatarCache.set(key, frames)
  return frames
}

// --- floor tiles: 16x16, tiled at PX scale (64px on screen) -----------------

const tileCache = new Map<string, Texture>()

export type FloorKind = "wood" | "voice" | "meeting" | "focus"

export function floorTexture(kind: FloorKind): Texture {
  let tex = tileCache.get(kind)
  if (tex) return tex
  const { canvas, ctx } = makeCanvas(16, 16)
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  }
  if (kind === "wood") {
    // plank floor: two rows of offset boards
    px(0, 0, 16, 16, "#4a3828")
    px(0, 0, 16, 7, "#54402e")
    px(0, 8, 16, 7, "#503d2c")
    px(10, 1, 1, 6, "#43331f") // board seams
    px(4, 9, 1, 6, "#43331f")
    px(2, 3, 2, 1, "#5e4936") // grain flecks
    px(12, 11, 2, 1, "#5e4936")
  } else {
    // carpet: base + stipple, tinted per zone kind
    const [base, dot] =
      kind === "voice" ? ["#2e5347", "#376052"] : kind === "meeting" ? ["#37405f", "#404a6e"] : ["#3a3f58", "#434965"]
    px(0, 0, 16, 16, base!)
    for (let i = 0; i < 16; i += 4)
      for (let j = 0; j < 16; j += 4) px(i + ((j / 4) % 2) * 2, j, 1, 1, dot!)
  }
  tex = toTexture(canvas)
  tileCache.set(kind, tex)
  return tex
}

// --- furniture: drawn at 1/PX of display size, scaled by PX in world.ts -----

const FURNITURE_PAINTERS: Record<string, { w: number; h: number; draw: (px: (x: number, y: number, w: number, h: number, c: string) => void) => void }> = {
  // desk 22x16 -> displays 88x64 (matches old SVG footprint)
  desk: {
    w: 22, h: 16,
    draw: (px) => {
      px(0, 2, 22, 11, "#6b4f35") // top
      px(0, 2, 22, 2, "#7d5d40") // front edge highlight
      px(2, 4, 9, 6, "#20242f") // monitor bezel
      px(3, 5, 7, 4, "#9fd0e8") // screen
      px(6, 10, 2, 1, "#454b6b") // stand
      px(13, 6, 6, 4, "#51576f") // laptop
      px(13, 11, 6, 1, "#3c415c") // keyboard
    },
  },
  // chair 8x9 -> 32x36 (old 30x34)
  chair: {
    w: 8, h: 9,
    draw: (px) => {
      px(1, 0, 6, 3, "#51576f") // backrest
      px(1, 3, 6, 4, "#5d6480") // seat
      px(3, 7, 2, 2, "#3c415c") // post
    },
  },
  // sofa 30x11 -> 120x44 (old 120x42)
  sofa: {
    w: 30, h: 11,
    draw: (px) => {
      px(0, 1, 30, 8, "#7a3b4f") // frame
      px(2, 2, 12, 4, "#8f4a60") // cushions
      px(16, 2, 12, 4, "#8f4a60")
      px(0, 7, 30, 3, "#6b3345") // base
      px(0, 0, 2, 9, "#6b3345") // armrests
      px(28, 0, 2, 9, "#6b3345")
    },
  },
  // plant 9x11 -> 36x44
  plant: {
    w: 9, h: 11,
    draw: (px) => {
      px(2, 7, 5, 4, "#8a5a33") // pot
      px(3, 10, 3, 1, "#6e4526")
      px(3, 2, 3, 6, "#3f8f4e") // foliage
      px(1, 3, 3, 4, "#2f6b3a")
      px(5, 1, 3, 4, "#357a42")
      px(4, 0, 2, 3, "#3f8f4e")
    },
  },
  // meetingTable 45x21 -> 180x84
  meetingTable: {
    w: 45, h: 21,
    draw: (px) => {
      px(1, 1, 43, 19, "#6b4f35") // top
      px(3, 3, 39, 15, "#7d5d40") // inset
      px(17, 8, 11, 5, "#20242f") // conference screen
      px(18, 9, 9, 3, "#9fd0e8")
    },
  },
}

export type FurnitureKind = keyof typeof FURNITURE_PAINTERS & string

const furnitureCache = new Map<string, Texture>()

export function furnitureTexture(kind: FurnitureKind): Texture {
  let tex = furnitureCache.get(kind)
  if (tex) return tex
  const spec = FURNITURE_PAINTERS[kind]!
  const { canvas, ctx } = makeCanvas(spec.w, spec.h)
  spec.draw((x, y, w, h, c) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, w, h)
  })
  tex = toTexture(canvas)
  furnitureCache.set(kind, tex)
  return tex
}
