import * as THREE from "three"
import { WORLD } from "@repo/game-core"

// Display height in world units. Characters are ~130px native; 128 ≈ 4 tiles.
// ponytail: tune if too large/small relative to furniture.
export const CHAR_HEIGHT = 128

const CHAR_META: Record<string, { walk: number; hello: number }> = {
  luffy:   { walk: 5, hello: 3 },
  zoro:    { walk: 5, hello: 4 },
  nami:    { walk: 6, hello: 4 },
  sanji:   { walk: 5, hello: 4 },
  robin:   { walk: 6, hello: 4 },
  brook:   { walk: 5, hello: 4 },
  chopper: { walk: 5, hello: 3 },
  usopp:   { walk: 5, hello: 3 },
}

export type CharState = "walk" | "hello" | "sit"

export interface CharacterSprite {
  sprite: THREE.Sprite
  /** Call every frame: advances animation and flips direction. elapsed = clock.getElapsedTime(). */
  update(state: CharState, dir: string, elapsed: number): void
  /** Positions the sprite at world pixel coords (wx, wy). */
  setPosition(wx: number, wy: number): void
  dispose(): void
}

const loader = new THREE.TextureLoader()

export async function loadCharacterSprite(name: string): Promise<CharacterSprite> {
  // ponytail: non-null asserted — fallback to luffy guarantees defined
  const meta = (CHAR_META[name] ?? CHAR_META["luffy"])!
  const base = `/assets/characters/${name}`

  const [walkTex, helloTex, sitTex] = await Promise.all([
    loader.loadAsync(`${base}.png`),
    loader.loadAsync(`${base}_hello.png`),
    loader.loadAsync(`${base}_sit.png`),
  ])

  for (const t of [walkTex, helloTex, sitTex]) {
    t.magFilter = THREE.NearestFilter
    t.minFilter = THREE.NearestFilter
    t.colorSpace = THREE.SRGBColorSpace
  }

  // Each texture starts showing frame 0
  walkTex.repeat.set(1 / meta.walk, 1)
  helloTex.repeat.set(1 / meta.hello, 1)
  sitTex.repeat.set(1, 1) // single frame

  const mat = new THREE.SpriteMaterial({ map: walkTex, transparent: true, alphaTest: 0.05 })
  const sprite = new THREE.Sprite(mat)

  // Scale width proportionally from CHAR_HEIGHT using the walk sheet aspect
  const nativeH = walkTex.image.height
  const nativeW = walkTex.image.width / meta.walk // single frame width
  const aspect = nativeW / nativeH
  sprite.scale.set(CHAR_HEIGHT * aspect, CHAR_HEIGHT, 1)

  let curTex = walkTex
  let curFrames = meta.walk

  return {
    sprite,

    update(state: CharState, dir: string, elapsed: number) {
      const nextTex = state === "hello" ? helloTex : state === "sit" ? sitTex : walkTex
      const nextFrames = state === "hello" ? meta.hello : state === "sit" ? 1 : meta.walk

      if (nextTex !== curTex) {
        mat.map = nextTex
        nextTex.offset.x = 0
        curTex = nextTex
        curFrames = nextFrames
        mat.needsUpdate = true
      }

      const frame = Math.floor(elapsed * 10) % curFrames
      curTex.offset.x = frame / curFrames

      // flip horizontally for left-facing direction
      const absX = Math.abs(sprite.scale.x)
      sprite.scale.x = dir === "left" ? -absX : absX
    },

    setPosition(wx: number, wy: number) {
      sprite.position.set(
        wx - WORLD.width / 2,
        CHAR_HEIGHT / 2, // feet at y=0 (floor)
        wy - WORLD.height / 2,
      )
    },

    dispose() {
      walkTex.dispose()
      helloTex.dispose()
      sitTex.dispose()
      mat.dispose()
      sprite.removeFromParent()
    },
  }
}
