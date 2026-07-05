// Pixi world client (plain TS, no React). Renders the authoritative Colyseus
// "world" room state; talks to React only via the bridge (plan §12).
// Art is owned: procedural pixel kit (lib/pixel-art.ts) + Graphics — no third-party atlases.

import { AnimatedSprite, Application, Container, Graphics, Sprite, Text, TilingSprite } from "pixi.js"
import { Client, getStateCallbacks } from "colyseus.js"
import {
  MSG,
  WORLD,
  SPIKE_ZONES,
  CHAT_BROADCAST,
  LEVEL_UP,
  SnapshotBuffer,
  dayPhase,
  darknessAt,
  proximityGain,
  type ChatBroadcast,
  type LevelUpBroadcast,
  type WorldRoomState,
  type PlayerState,
} from "@repo/game-core"
import { bridge } from "./bridge"
import { applyProximityGains } from "./media"
import { PX, avatarFrames, floorTexture, furnitureTexture, type Dir, type FurnitureKind } from "./pixel-art"

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:2567"

type Avatar = {
  root: Container
  sprite: AnimatedSprite // walk-cycle frames, swapped per facing direction
  frames: ReturnType<typeof avatarFrames>
  dir: Dir
  lastX: number
  lastY: number
}

/** Owned pixel character (lib/pixel-art.ts kit): AnimatedSprite walk cycle +
 *  soft shadow + name label. Textures are generated sync — no pop-in. */
function makeAvatar(id: string, own: boolean): Avatar {
  const root = new Container()

  if (own) {
    const ring = new Graphics().circle(0, -16, 28).stroke({ width: 2, color: 0xffffff, alpha: 0.7 })
    root.addChild(ring)
  }

  // soft ellipse shadow under the feet (doesn't animate with the walk cycle)
  const shadow = new Graphics().ellipse(0, 20, 13, 3.5).fill({ color: 0x000000, alpha: 0.25 })
  root.addChild(shadow)

  const frames = avatarFrames(id)
  const sprite = new AnimatedSprite(frames.down)
  sprite.anchor.set(0.5, 1)
  sprite.y = 20 // feet at the shadow line
  sprite.scale.set(3) // 16x24 art -> 48x72 on screen
  sprite.animationSpeed = 0.12
  root.addChild(sprite)

  const label = new Text({
    text: id,
    // ponytail: monospace Text passes as "pixel-styled"; swap for a real
    // BitmapFont pixel face if labels ever need to be crisper/cheaper
    style: { fontSize: 11, fontFamily: "monospace", fill: 0xffffff, stroke: { color: 0x000000, width: 3 } },
  })
  label.anchor.set(0.5)
  label.y = -62

  root.addChild(label)
  return { root, sprite, frames, dir: "down", lastX: 0, lastY: 0 }
}

/** Code-drawn pixel office floorplan — owned art by construction (plan §27). */
function drawOffice(): Container {
  const c = new Container()

  // wood plank floor across the whole world (16px tile x PX = 64px on screen)
  // ponytail: TilingSprites over the lazy path (one GPU quad each); prebake to
  // a RenderTexture if tile variety ever grows past a handful
  const floor = new TilingSprite({
    texture: floorTexture("wood"),
    width: WORLD.width,
    height: WORLD.height,
  })
  floor.tileScale.set(PX)
  c.addChild(floor)

  // zone rooms: carpet tiles per zone kind
  for (const z of SPIKE_ZONES) {
    const { x, y, w, h } = z.bounds
    const kind = z.kind === "voice" ? "voice" : z.kind === "meeting" ? "meeting" : "focus"
    const carpet = new TilingSprite({ texture: floorTexture(kind), width: w, height: h })
    carpet.tileScale.set(PX)
    carpet.position.set(x, y)
    c.addChild(carpet)
  }

  // walls: flat pixel-toned Graphics (top face + darker bottom lip)
  const g = new Graphics()
  g.rect(0, 0, WORLD.width, 12).rect(0, WORLD.height - 12, WORLD.width, 12)
    .rect(0, 0, 12, WORLD.height).rect(WORLD.width - 12, 0, 12, WORLD.height)
    .fill(0x454b6b)
  g.rect(0, 12, WORLD.width, 4).fill(0x353a55) // lip under the top wall

  for (const z of SPIKE_ZONES) {
    const { x, y, w, h } = z.bounds
    // walls with a centered door gap on the bottom edge
    const door = 72
    g.rect(x, y, w, 6).fill(0x454b6b) // top
    g.rect(x, y + 6, w, 3).fill(0x353a55) // lip
    g.rect(x, y, 6, h).rect(x + w - 6, y, 6, h).fill(0x454b6b) // sides
    g.rect(x, y + h - 6, (w - door) / 2, 6).rect(x + (w + door) / 2, y + h - 6, (w - door) / 2, 6).fill(0x454b6b)
  }
  c.addChild(g)

  // furniture: owned pixel sprites (lib/pixel-art.ts), generated sync
  const place = (kind: FurnitureKind, x: number, y: number, rotation = 0) => {
    const sp = new Sprite(furnitureTexture(kind))
    sp.anchor.set(0.5)
    sp.position.set(x, y)
    sp.rotation = rotation
    sp.scale.set(PX)
    c.addChild(sp)
  }

  // desk pods in the open area (desk + chair below)
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++) {
      const x = 744 + col * 160
      const y = 172 + row * 160
      place("desk", x, y)
      place("chair", x, y + 52)
    }

  // meeting room: table + chairs around it
  const m = SPIKE_ZONES.find((z) => z.kind === "meeting")!.bounds
  place("meetingTable", m.x + m.w / 2, m.y + m.h / 2)
  for (let i = 0; i < 4; i++) {
    place("chair", m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 - 62)
    place("chair", m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 + 62)
  }

  // lounge: sofas (voice zone)
  const v = SPIKE_ZONES.find((z) => z.kind === "voice")!.bounds
  place("sofa", v.x + 90, v.y + 57)
  place("sofa", v.x + 90, v.y + v.h - 57)
  place("sofa", v.x + v.w - 53, v.y + 150, Math.PI / 2)

  // plants in the corners
  for (const [px, py] of [[50, 50], [WORLD.width - 50, 50], [50, WORLD.height - 50], [WORLD.width - 50, WORLD.height - 50]] as const) {
    place("plant", px, py)
  }

  // room labels
  for (const z of SPIKE_ZONES) {
    const t = new Text({
      text: z.id,
      style: { fontSize: 13, fontFamily: "monospace", fill: 0xaab3d0, stroke: { color: 0x000000, width: 2 } },
    })
    t.anchor.set(0.5)
    t.position.set(z.bounds.x + z.bounds.w / 2, z.bounds.y + 20)
    c.addChild(t)
  }
  return c
}

export type WorldHandle = {
  destroy: () => void
  /** send a chat message to the room (React calls this directly, not via bridge) */
  sendChat: (text: string) => void
}

/** Mounts the world into `el`; resolves to a handle with destroy + sendChat.
 *  `token` is the gateway access JWT — the room's onAuth rejects joins without it. */
export async function createWorld(el: HTMLElement, token: string): Promise<WorldHandle> {
  const app = new Application()
  await app.init({ resizeTo: window, background: 0x14161f })
  app.canvas.style.display = "block"
  el.appendChild(app.canvas)

  // camera: everything lives in `worldLayer`; the ticker moves the layer so the
  // own player stays centered. World is bigger than the screen now.
  const worldLayer = new Container()
  app.stage.addChild(worldLayer)
  worldLayer.addChild(drawOffice())

  const playerLayer = new Container()
  worldLayer.addChild(playerLayer)

  // day/night: deep-blue overlay whose alpha follows the shared clock cycle
  const nightOverlay = new Graphics().rect(0, 0, WORLD.width, WORLD.height).fill(0x0a1030)
  worldLayer.addChild(nightOverlay)

  const ZOOM = 1
  const camera = { x: WORLD.width / 2, y: WORLD.height / 2 }
  const updateCamera = (targetX: number, targetY: number, lerp: number) => {
    camera.x += (targetX - camera.x) * lerp
    camera.y += (targetY - camera.y) * lerp
    const vw = app.screen.width / ZOOM
    const vh = app.screen.height / ZOOM
    // clamp so the view never leaves the world (world smaller than view -> center)
    const cx = vw >= WORLD.width ? WORLD.width / 2 : Math.min(Math.max(camera.x, vw / 2), WORLD.width - vw / 2)
    const cy = vh >= WORLD.height ? WORLD.height / 2 : Math.min(Math.max(camera.y, vh / 2), WORLD.height - vh / 2)
    worldLayer.scale.set(ZOOM)
    worldLayer.position.set(app.screen.width / 2 - cx * ZOOM, app.screen.height / 2 - cy * ZOOM)
  }
  updateCamera(camera.x, camera.y, 1)

  let room
  try {
    room = await new Client(REALTIME_URL).joinOrCreate<WorldRoomState>("world", { token })
  } catch (err) {
    bridge.emit("net:disconnected", undefined)
    app.destroy(true, { children: true })
    throw err
  }
  bridge.emit("net:connected", { sessionId: room.sessionId })
  room.onLeave(() => bridge.emit("net:disconnected", undefined))
  room.onMessage(CHAT_BROADCAST, (msg: ChatBroadcast) => bridge.emit("chat:message", msg))
  room.onMessage(LEVEL_UP, (msg: LevelUpBroadcast) => {
    if (msg.sessionId === room.sessionId) bridge.emit("player:level-up", { level: msg.level })
  })

  const $ = getStateCallbacks(room)
  const remotes = new Map<string, { avatar: Avatar; buf: SnapshotBuffer; state: PlayerState }>()
  let own: { avatar: Avatar; state: PlayerState } | null = null

  $(room.state).players.onAdd((p, id) => {
    // p.id = JWT identity (label); map key `id` stays the sessionId
    const avatar = makeAvatar(p.id, id === room.sessionId)
    avatar.root.position.set(p.x, p.y)
    avatar.lastX = p.x
    avatar.lastY = p.y
    playerLayer.addChild(avatar.root)

    if (id === room.sessionId) {
      // ponytail: no client-side prediction — own avatar rendered straight
      // from server state (~1 RTT input lag). Add prediction+reconciliation
      // if movement feels mushy.
      own = { avatar, state: p }
      camera.x = p.x
      camera.y = p.y
      $(p).listen("zoneId", (zoneId) => bridge.emit("player:zone-changed", { zoneId }))
      // xp changes are discrete server awards, not per-frame — safe for the bridge
      $(p).listen("xp", (xp) => bridge.emit("player:xp-changed", { xp, level: p.level }))
      $(p).listen("level", (level) => bridge.emit("player:xp-changed", { xp: p.xp, level }))
      $(p).listen("questStep", (questStep) => bridge.emit("player:quest-changed", { questStep }))
      $(p).listen("streak", (streak) => bridge.emit("player:streak-changed", { streak }))
    } else {
      // render remotes 100ms in the past, lerped between server snapshots
      const buf = new SnapshotBuffer()
      buf.push({ t: performance.now(), x: p.x, y: p.y })
      remotes.set(id, { avatar, buf, state: p })
      $(p).onChange(() => buf.push({ t: performance.now(), x: p.x, y: p.y }))
    }
  })

  $(room.state).players.onRemove((_p, id) => {
    const r = remotes.get(id)
    if (r) {
      r.avatar.root.destroy()
      remotes.delete(id)
    }
  })

  // walk-cycle playback + facing, shared by own and remote avatars
  const animate = (a: Avatar, x: number, y: number, dir: string) => {
    const moving = Math.abs(x - a.lastX) > 0.1 || Math.abs(y - a.lastY) > 0.1
    a.root.position.set(x, y)
    const d: Dir = dir === "up" || dir === "left" || dir === "right" ? dir : "down"
    if (d !== a.dir) {
      a.dir = d
      const playing = a.sprite.playing
      a.sprite.textures = a.frames[d] // resets to frame 0, stops playback
      if (playing) a.sprite.play()
    }
    if (moving && !a.sprite.playing) a.sprite.play()
    if (!moving && a.sprite.playing) a.sprite.gotoAndStop(0) // idle frame
    a.lastX = x
    a.lastY = y
  }

  let lastProx = 0
  app.ticker.add(() => {
    nightOverlay.alpha = darknessAt(dayPhase())
    const now = performance.now()
    if (own) {
      animate(own.avatar, own.state.x, own.state.y, own.state.dir)
      updateCamera(own.state.x, own.state.y, 0.12)
    }
    for (const { avatar, buf, state } of remotes.values()) {
      const pos = buf.sample(now)
      if (pos) animate(avatar, pos.x, pos.y, state.dir)
    }
    // proximity voice: feed distance gains to media every 250ms (never per frame)
    if (own && now - lastProx > 250) {
      lastProx = now
      const gains = new Map<string, number>()
      for (const { state } of remotes.values()) {
        const d = Math.hypot(state.x - own.state.x, state.y - own.state.y)
        // state.id = JWT identity — matches the LiveKit participant identity
        gains.set(state.id, proximityGain(d))
      }
      applyProximityGains(gains)
    }
  })

  // input: send MOVE only when the direction actually changes, never per frame
  const DIR_KEYS = new Set([
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "KeyW", "KeyA", "KeyS", "KeyD",
  ])
  const pressed = new Set<string>()
  let last = { dx: 0, dy: 0 }
  const has = (...codes: string[]) => codes.some((c) => pressed.has(c))
  const isTyping = () => {
    const el = document.activeElement
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
  }
  const onKey = (e: KeyboardEvent) => {
    if (!DIR_KEYS.has(e.code)) return
    // root cause fix: WASD must never move the player while a text field is
    // focused. Also clear held keys so movement stops if focus happened mid-hold.
    if (isTyping()) {
      pressed.clear()
      if (last.dx !== 0 || last.dy !== 0) {
        last = { dx: 0, dy: 0 }
        room.send(MSG.MOVE, last)
      }
      return
    }
    if (e.type === "keydown") pressed.add(e.code)
    else pressed.delete(e.code)
    const dx = (has("ArrowRight", "KeyD") ? 1 : 0) - (has("ArrowLeft", "KeyA") ? 1 : 0)
    const dy = (has("ArrowDown", "KeyS") ? 1 : 0) - (has("ArrowUp", "KeyW") ? 1 : 0)
    if (dx !== last.dx || dy !== last.dy) {
      last = { dx, dy }
      room.send(MSG.MOVE, last)
    }
  }
  window.addEventListener("keydown", onKey)
  window.addEventListener("keyup", onKey)

  return {
    sendChat: (text: string) => {
      const t = text.trim()
      if (t) room.send(MSG.CHAT, { text: t })
    },
    destroy: () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("keyup", onKey)
      void room.leave()
      app.destroy(true, { children: true })
    },
  }
}
