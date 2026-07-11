/**
 * CharacterLayer.ts
 * Manages the player character and all NPCs.
 *
 * Each character has 3 sprite states:
 *   - idle:    <char>.png
 *   - greeting: <char>_hello.png  (triggered by SPACE or proximity)
 *   - sitting: <char>_sit.png
 *
 * The player starts center-map and responds to WASD/arrow keys.
 * NPCs are placed at fixed positions and greet when the player is < threshold px away.
 */
import { Container, Sprite, Assets, Text, Graphics } from "pixi.js"
import { NPCS, TILE_SIZE, MAP_COLS, MAP_ROWS } from "./map-data"
import type { NpcDef } from "./map-data"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

const CHAR_SCALE = 2.2        // upscale the 48px sprites to feel game-sized
const GREET_RADIUS = 80       // pixels
const GREET_DURATION = 120    // ticks (~2s at 60fps)

interface NpcSprite {
  def: NpcDef
  container: Container
  idleTex: import("pixi.js").Texture
  helloTex: import("pixi.js").Texture
  sprite: Sprite
  label: Container
  bubble: Container | null
  greetTimer: number
  bobT: number
}

export class CharacterLayer {
  container: Container
  player!: Sprite
  private playerHelloTex!: import("pixi.js").Texture
  private playerIdleTex!: import("pixi.js").Texture
  private npcs: NpcSprite[] = []
  private theme: Theme
  private userName: string
  private isWalking = false
  private walkDir = 0
  private playerGreeting = false
  private playerGreetTimer = 0
  private playerNameLabel!: Container

  constructor(theme: Theme, userName: string) {
    this.container = new Container()
    this.theme = theme
    this.userName = userName
  }

  async init() {
    // Player — use "luffy" as the player stand-in (first character)
    const [idleTex, helloTex] = await Promise.all([
      Assets.load("/_godot/assets/characters/luffy.png"),
      Assets.load("/_godot/assets/characters/luffy_hello.png"),
    ])

    idleTex.source.scaleMode = "nearest"
    helloTex.source.scaleMode = "nearest"
    this.playerIdleTex = idleTex
    this.playerHelloTex = helloTex

    this.player = new Sprite(idleTex)
    this.player.anchor.set(0.5, 1)
    this.player.scale.set(CHAR_SCALE)
    this.player.x = Math.floor(MAP_COLS / 2) * TILE_SIZE
    this.player.y = Math.floor(MAP_ROWS / 2) * TILE_SIZE

    // Player name label
    this.playerNameLabel = this._makeNameLabel(this.userName, 0, "🎮", true)
    this.container.addChild(this.player)
    this.container.addChild(this.playerNameLabel)

    // NPCs
    await this._buildNpcs()
  }

  private async _buildNpcs() {
    for (const def of NPCS) {
      // Skip player character (luffy is player)
      const [idleTex, helloTex] = await Promise.all([
        Assets.load(`/_godot/assets/characters/${def.char}.png`),
        Assets.load(`/_godot/assets/characters/${def.char}_hello.png`).catch(
          () => Assets.load(`/_godot/assets/characters/${def.char}.png`)
        ),
      ])
      idleTex.source.scaleMode = "nearest"
      helloTex.source.scaleMode = "nearest"

      const sprite = new Sprite(idleTex)
      sprite.anchor.set(0.5, 1)
      sprite.scale.set(CHAR_SCALE * 0.85)

      const nc = new Container()
      nc.x = (def.col + 0.5) * TILE_SIZE
      nc.y = (def.row + 1) * TILE_SIZE
      nc.addChild(sprite)

      const label = this._makeNameLabel(def.name, def.level)
      nc.addChild(label)

      this.container.addChild(nc)

      this.npcs.push({
        def, container: nc, idleTex, helloTex,
        sprite, label, bubble: null,
        greetTimer: 0, bobT: Math.random() * Math.PI * 2
      })
    }
  }

  private _makeNameLabel(name: string, level: number, emoji = "", isPlayer = false): Container {
    const c = new Container()

    // Pill background
    const pill = new Graphics()
    const bg = isPlayer ? 0x7b7bf8 : 0x1a1a2e
    const alpha = isPlayer ? 0.92 : 0.75
    pill.roundRect(-38, -14, 76, 18, 9)
    pill.fill({ color: bg, alpha })
    c.addChild(pill)

    // Name text
    const style = {
      fontFamily: "system-ui, sans-serif",
      fontSize: 10,
      fill: isPlayer ? "#ffffff" : "#c9e4f8",
      fontWeight: "bold" as const,
    }
    const nameT = new Text({ text: `${emoji}${name}${level ? ` · Lv${level}` : ""}`, style })
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
      style: { fontFamily: "system-ui", fontSize: 9, fill: "#ffffff", fontWeight: "bold" }
    })
    t.anchor.set(0.5, 0.5)
    t.y = -8
    c.addChild(t)

    c.y = -TILE_SIZE * CHAR_SCALE * 0.85 - 44
    return c
  }

  playerGreet() {
    this.playerGreeting = true
    this.playerGreetTimer = GREET_DURATION
    this.player.texture = this.playerHelloTex
  }

  setWalking(walking: boolean, dirX: number) {
    this.isWalking = walking
    this.walkDir = dirX
    if (walking && !this.playerGreeting) {
      // Flip sprite based on direction
      this.player.scale.x = dirX < 0 ? -CHAR_SCALE : CHAR_SCALE
    }
  }

  tick(dt: number) {
    // Player greet timer
    if (this.playerGreeting) {
      this.playerGreetTimer -= dt
      if (this.playerGreetTimer <= 0) {
        this.playerGreeting = false
        this.player.texture = this.playerIdleTex
      }
    }

    // Walk bob on player
    if (this.isWalking) {
      this.player.y += Math.sin(Date.now() * 0.012) * 0.3
    }

    // Update player name label position
    this.playerNameLabel.x = this.player.x
    this.playerNameLabel.y = this.player.y

    // NPC animations
    for (const npc of this.npcs) {
      npc.bobT += 0.04 * dt

      // Bob up and down
      npc.container.y = (npc.def.row + 1) * TILE_SIZE + Math.sin(npc.bobT) * 2.5

      // Greet timer
      if (npc.greetTimer > 0) {
        npc.greetTimer -= dt
        if (npc.greetTimer <= 0) {
          npc.sprite.texture = npc.idleTex
          if (npc.bubble) {
            npc.container.removeChild(npc.bubble)
            npc.bubble.destroy({ children: true })
            npc.bubble = null
          }
        }
      }

      // Proximity greeting
      const dist = this._dist(this.player.x, this.player.y, npc.container.x, npc.container.y)
      if (dist < GREET_RADIUS && npc.greetTimer <= 0) {
        npc.greetTimer = GREET_DURATION
        npc.sprite.texture = npc.helloTex
        if (!npc.bubble) {
          npc.bubble = this._makeBubble(npc.def.greeting)
          npc.container.addChild(npc.bubble)
        }
      }

      // Face player
      const dx = this.player.x - npc.container.x
      npc.sprite.scale.x = dx < 0 ? -(CHAR_SCALE * 0.85) : CHAR_SCALE * 0.85
    }

    // Z-sort everything by Y
    this.container.sortChildren()
  }

  getNearbyNPC(radius: number): string | null {
    for (const npc of this.npcs) {
      const d = this._dist(this.player.x, this.player.y, npc.container.x, npc.container.y)
      if (d < radius) return npc.def.name
    }
    return null
  }

  private _dist(ax: number, ay: number, bx: number, by: number) {
    const dx = ax - bx, dy = ay - by
    return Math.sqrt(dx * dx + dy * dy)
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}
