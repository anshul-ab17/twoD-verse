/**
 * CharacterLayer.ts
 * Player avatar, remote players and decorative NPCs.
 *
 * Sheets per character (sliced in sprites.ts):
 *   walk  <char>.png        — frame 0 = idle, cycled while moving
 *   hello <char>_hello.png  — cycled while greeting (SPACE / proximity)
 *
 * Player + remotes are server-driven (positions from Colyseus); NPCs bob in
 * place and greet when the player comes near.
 */
import { Container, Sprite, Text, Graphics, type Texture } from "pixi.js"
import { NPCS, TILE_SIZE, MAP_COLS, MAP_ROWS } from "./map-data"
import type { NpcDef } from "./map-data"
import { loadCharacter, ANIM_FPS, type CharTextures } from "./sprites"

const CHAR_SCALE = 2.2        // upscale the 48px-ish sprites to feel game-sized
const GREET_RADIUS = 80       // pixels
const GREET_DURATION = 120    // ticks (~2s at 60fps)
const FRAME_TICKS = 60 / ANIM_FPS

interface Avatar {
  container: Container
  sprite: Sprite
  tex: CharTextures
  scale: number
  walking: boolean
  greetTimer: number
  animT: number
  lastX: number
  lastY: number
}

interface NpcSprite extends Avatar {
  def: NpcDef
  bubble: Container | null
  bobT: number
}

export class CharacterLayer {
  container: Container
  private player_!: Avatar
  private remotes = new Map<string, Avatar>()
  private npcs: NpcSprite[] = []
  private userName: string
  private character: string
  private inputWalking = false
  private inputDir = 0

  constructor(character: string, userName: string) {
    this.container = new Container()
    this.character = character
    this.userName = userName
  }

  /** player position sprite (read by camera + room detection) */
  get player(): Container {
    return this.player_.container
  }

  async init() {
    const tex = await loadCharacter(this.character)
    this.player_ = this._makeAvatar(tex, CHAR_SCALE, this.userName, 0, true)
    this.player_.container.x = (MAP_COLS / 2) * TILE_SIZE
    this.player_.container.y = (MAP_ROWS / 2) * TILE_SIZE
    this.container.addChild(this.player_.container)
    await this._buildNpcs()
  }

  private _makeAvatar(tex: CharTextures, scale: number, name: string, level: number, isPlayer = false): Avatar {
    const sprite = new Sprite(tex.walk[0])
    sprite.anchor.set(0.5, 1)
    sprite.scale.set(scale)
    const container = new Container()
    container.addChild(sprite)
    container.addChild(this._makeNameLabel(name, level, isPlayer))
    return { container, sprite, tex, scale, walking: false, greetTimer: 0, animT: 0, lastX: 0, lastY: 0 }
  }

  // --- remote players (Colyseus) ---

  async addRemote(id: string, character: string, name: string) {
    if (this.remotes.has(id)) return
    const tex = await loadCharacter(character)
    if (!this.remotes.has(id)) { // may have been removed while loading
      const a = this._makeAvatar(tex, CHAR_SCALE, name, 0)
      this.remotes.set(id, a)
      this.container.addChild(a.container)
    }
  }

  removeRemote(id: string) {
    const a = this.remotes.get(id)
    this.remotes.delete(id)
    if (a) {
      this.container.removeChild(a.container)
      a.container.destroy({ children: true })
    }
  }

  setRemotePos(id: string, x: number, y: number) {
    const a = this.remotes.get(id)
    if (!a) return
    const dx = x - a.container.x
    a.walking = Math.abs(dx) + Math.abs(y - a.container.y) > 0.5
    if (Math.abs(dx) > 0.5) a.sprite.scale.x = dx < 0 ? -a.scale : a.scale
    a.container.x = x
    a.container.y = y
  }

  // --- NPCs ---

  private async _buildNpcs() {
    for (const def of NPCS) {
      if (def.char === this.character) continue // player took this crew member
      const tex = await loadCharacter(def.char)
      const a = this._makeAvatar(tex, CHAR_SCALE * 0.85, def.name, def.level)
      a.container.x = (def.col + 0.5) * TILE_SIZE
      a.container.y = (def.row + 1) * TILE_SIZE
      this.container.addChild(a.container)
      this.npcs.push({ ...a, def, bubble: null, bobT: Math.random() * Math.PI * 2 })
    }
  }

  private _makeNameLabel(name: string, level: number, isPlayer = false): Container {
    const c = new Container()
    const pill = new Graphics()
    pill.roundRect(-38, -14, 76, 18, 9)
    pill.fill({ color: isPlayer ? 0x7b7bf8 : 0x1a1a2e, alpha: isPlayer ? 0.92 : 0.75 })
    c.addChild(pill)

    const nameT = new Text({
      text: `${name}${level ? ` · Lv${level}` : ""}`,
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 10,
        fill: isPlayer ? "#ffffff" : "#c9e4f8",
        fontWeight: "bold" as const,
      },
    })
    nameT.anchor.set(0.5, 0.5)
    nameT.y = -5
    c.addChild(nameT)

    c.y = -TILE_SIZE * CHAR_SCALE * 0.88 - 20
    return c
  }

  private _makeBubble(text: string): Container {
    const c = new Container()
    const w = Math.min(140, text.length * 8 + 20)
    const g = new Graphics()
    g.roundRect(-w / 2, -18, w, 20, 6)
    g.fill({ color: 0x1e2330, alpha: 0.9 })
    c.addChild(g)

    const t = new Text({
      text,
      style: { fontFamily: "system-ui", fontSize: 9, fill: "#ffffff", fontWeight: "bold" },
    })
    t.anchor.set(0.5, 0.5)
    t.y = -8
    c.addChild(t)

    c.y = -TILE_SIZE * CHAR_SCALE * 0.85 - 44
    return c
  }

  playerGreet() {
    this.player_.greetTimer = GREET_DURATION
  }

  setWalking(walking: boolean, dirX: number) {
    this.inputWalking = walking
    this.inputDir = dirX
  }

  /** advance one avatar's animation state (frame cycling + greet countdown) */
  private _animate(a: Avatar, dt: number) {
    a.animT += dt
    if (a.greetTimer > 0) {
      a.greetTimer -= dt
      const frames = a.tex.hello
      a.sprite.texture = frames[Math.floor(a.animT / FRAME_TICKS) % frames.length] as Texture
      return
    }
    if (a.walking) {
      const frames = a.tex.walk
      a.sprite.texture = frames[Math.floor(a.animT / FRAME_TICKS) % frames.length] as Texture
    } else {
      a.sprite.texture = a.tex.walk[0] as Texture
    }
  }

  tick(dt: number) {
    const p = this.player_
    p.walking = this.inputWalking
    if (this.inputWalking && this.inputDir !== 0) {
      p.sprite.scale.x = this.inputDir < 0 ? -p.scale : p.scale
    }
    this._animate(p, dt)
    for (const a of this.remotes.values()) this._animate(a, dt)

    for (const npc of this.npcs) {
      npc.bobT += 0.04 * dt
      npc.container.y = (npc.def.row + 1) * TILE_SIZE + Math.sin(npc.bobT) * 2.5
      this._animate(npc, dt)

      if (npc.greetTimer <= 0 && npc.bubble) {
        npc.container.removeChild(npc.bubble)
        npc.bubble.destroy({ children: true })
        npc.bubble = null
      }

      const dist = this._dist(p.container.x, p.container.y, npc.container.x, npc.container.y)
      if (dist < GREET_RADIUS && npc.greetTimer <= 0) {
        npc.greetTimer = GREET_DURATION
        npc.animT = 0
        if (!npc.bubble) {
          npc.bubble = this._makeBubble(npc.def.greeting)
          npc.container.addChild(npc.bubble)
        }
      }

      const dx = p.container.x - npc.container.x
      npc.sprite.scale.x = dx < 0 ? -npc.scale : npc.scale
    }

    // Z-sort everything by Y
    this.container.children.sort((a, b) => a.y - b.y)
  }

  getNearbyNPC(radius: number): string | null {
    for (const npc of this.npcs) {
      const d = this._dist(this.player_.container.x, this.player_.container.y, npc.container.x, npc.container.y)
      if (d < radius) return npc.def.name
    }
    return null
  }

  private _dist(ax: number, ay: number, bx: number, by: number) {
    const dx = ax - bx, dy = ay - by
    return Math.sqrt(dx * dx + dy * dy)
  }

  destroy() {
    this.remotes.clear()
    this.container.destroy({ children: true })
  }
}
