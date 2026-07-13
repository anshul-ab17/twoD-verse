/**
 * sprites.ts
 * Godot character sheets are horizontal strips of uniform-width frames.
 * Slices them into per-frame Pixi Textures; cached per character.
 */
import { Assets, Rectangle, Texture } from "pixi.js"

export const CHARACTERS = [
  "luffy", "zoro", "nami", "sanji", "robin", "brook", "chopper", "usopp",
] as const
export type CharName = (typeof CHARACTERS)[number]

// frame counts per sheet (spec §3); franky excluded — frames unsplit
const WALK_FRAMES: Record<CharName, number> = {
  luffy: 5, zoro: 5, nami: 6, sanji: 5, robin: 6, brook: 5, chopper: 5, usopp: 5,
}
const HELLO_FRAMES: Record<CharName, number> = {
  luffy: 3, zoro: 4, nami: 4, sanji: 4, robin: 4, brook: 4, chopper: 3, usopp: 3,
}

export const ANIM_FPS = 10

export type CharTextures = { walk: Texture[]; hello: Texture[] }

const cache = new Map<string, Promise<CharTextures>>()

function slice(base: Texture, count: number): Texture[] {
  const fw = Math.floor(base.width / count)
  return Array.from(
    { length: count },
    (_, i) => new Texture({ source: base.source, frame: new Rectangle(i * fw, 0, fw, base.height) }),
  )
}

export function loadCharacter(name: string): Promise<CharTextures> {
  let p = cache.get(name)
  if (!p) {
    const n: CharName = (CHARACTERS as readonly string[]).includes(name) ? (name as CharName) : "luffy"
    p = (async () => {
      const [walkBase, helloBase] = await Promise.all([
        Assets.load<Texture>(`/_godot/assets/characters/${n}.png`),
        Assets.load<Texture>(`/_godot/assets/characters/${n}_hello.png`),
      ])
      walkBase.source.scaleMode = "nearest"
      helloBase.source.scaleMode = "nearest"
      return { walk: slice(walkBase, WALK_FRAMES[n]), hello: slice(helloBase, HELLO_FRAMES[n]) }
    })()
    cache.set(name, p)
  }
  return p
}
