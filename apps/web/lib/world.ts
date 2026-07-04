// Pixi world client (plain TS, no React). Renders the authoritative Colyseus
// "world" room state; talks to React only via the bridge (plan §12).
// Art is owned: programmatic Graphics only — no images, no third-party atlases.

import { Application, Container, Graphics, Text } from "pixi.js"
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
  type ChatBroadcast,
  type LevelUpBroadcast,
  type WorldRoomState,
  type PlayerState,
} from "@repo/net-schema"
import { bridge } from "./bridge"

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:2567"

const PALETTE = [0xe4572e, 0x29c7ac, 0xf3a712, 0x5b8dee, 0xc74fd1, 0x8bc34a, 0xff7eb6, 0x00bcd4]

function colorFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]!
}

type Avatar = {
  root: Container
  body: Container // bobbed while walking
  eyes: Graphics // repositioned by facing direction
  lastX: number
  lastY: number
}

/** Simple owned character: capsule body + head + direction eyes + name label. */
function makeAvatar(id: string, own: boolean): Avatar {
  const root = new Container()
  const body = new Container()
  const color = colorFor(id)

  const g = new Graphics()
    .roundRect(-10, -8, 20, 24, 9) // torso
    .fill(color)
    .circle(0, -16, 9) // head
    .fill(0xf1d3b3)
    .ellipse(0, 18, 11, 4) // shadow
    .fill({ color: 0x000000, alpha: 0.25 })
  if (own) g.circle(0, -2, 24).stroke({ width: 2, color: 0xffffff, alpha: 0.7 })

  const eyes = new Graphics().circle(-3, -17, 1.6).circle(3, -17, 1.6).fill(0x222222)

  const label = new Text({
    text: id,
    style: { fontSize: 11, fill: 0xffffff, stroke: { color: 0x000000, width: 3 } },
  })
  label.anchor.set(0.5)
  label.y = -36

  body.addChild(g, eyes)
  root.addChild(body, label)
  return { root, body, eyes, lastX: 0, lastY: 0 }
}

/** Face eyes toward a direction ("up" hides them — back of head). */
function face(a: Avatar, dir: string) {
  a.eyes.visible = dir !== "up"
  a.eyes.x = dir === "left" ? -3 : dir === "right" ? 3 : 0
}

/** Code-drawn office floorplan — owned art by construction (plan §27). */
function drawOffice(): Container {
  const c = new Container()
  const g = new Graphics()

  // floor + subtle tile grid
  g.rect(0, 0, WORLD.width, WORLD.height).fill(0x23273a)
  for (let x = 0; x <= WORLD.width; x += 64) g.moveTo(x, 0).lineTo(x, WORLD.height)
  for (let y = 0; y <= WORLD.height; y += 64) g.moveTo(0, y).lineTo(WORLD.width, y)
  g.stroke({ width: 1, color: 0x2b3049, alpha: 0.8 })

  // outer walls
  g.rect(0, 0, WORLD.width, 12).rect(0, WORLD.height - 12, WORLD.width, 12)
    .rect(0, 0, 12, WORLD.height).rect(WORLD.width - 12, 0, 12, WORLD.height)
    .fill(0x454b6b)

  // zone rooms: floor tint + wall outline + door gap (drawn from zone data)
  for (const z of SPIKE_ZONES) {
    const { x, y, w, h } = z.bounds
    const tint = z.kind === "voice" ? 0x2e5347 : z.kind === "meeting" ? 0x37405f : 0x3a3f58
    g.rect(x, y, w, h).fill(tint)
    // walls with a centered door gap on the bottom edge
    const door = 72
    g.rect(x, y, w, 6).fill(0x454b6b) // top
    g.rect(x, y, 6, h).rect(x + w - 6, y, 6, h).fill(0x454b6b) // sides
    g.rect(x, y + h - 6, (w - door) / 2, 6).rect(x + (w + door) / 2, y + h - 6, (w - door) / 2, 6).fill(0x454b6b)
  }

  // desk pods in the open area (rows of desk+chair)
  const desk = (x: number, y: number) => {
    g.roundRect(x, y, 88, 44, 4).fill(0x6b4f35) // desktop
    g.roundRect(x + 8, y + 8, 30, 18, 2).fill(0x9fb4c7) // monitor
    g.circle(x + 44, y + 66, 12).fill(0x51576f) // chair
  }
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 4; col++) desk(700 + col * 160, 150 + row * 160)

  // meeting room: table + chairs (inside meeting-room zone)
  const m = SPIKE_ZONES.find((z) => z.kind === "meeting")!.bounds
  g.roundRect(m.x + m.w / 2 - 90, m.y + m.h / 2 - 40, 180, 80, 12).fill(0x6b4f35)
  for (let i = 0; i < 4; i++) {
    g.circle(m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 - 58, 10).fill(0x51576f)
    g.circle(m.x + m.w / 2 - 60 + i * 40, m.y + m.h / 2 + 58, 10).fill(0x51576f)
  }

  // lounge: sofas (voice zone)
  const v = SPIKE_ZONES.find((z) => z.kind === "voice")!.bounds
  g.roundRect(v.x + 30, v.y + 40, 120, 34, 10).fill(0x7a3b4f)
  g.roundRect(v.x + 30, v.y + v.h - 74, 120, 34, 10).fill(0x7a3b4f)
  g.roundRect(v.x + v.w - 70, v.y + 90, 34, 120, 10).fill(0x7a3b4f)

  // plants in the corners
  for (const [px, py] of [[50, 50], [WORLD.width - 50, 50], [50, WORLD.height - 50], [WORLD.width - 50, WORLD.height - 50]] as const) {
    g.circle(px, py, 16).fill(0x2f6b3a).circle(px, py, 7).fill(0x3f8f4e)
  }

  c.addChild(g)

  // room labels
  for (const z of SPIKE_ZONES) {
    const t = new Text({
      text: z.id,
      style: { fontSize: 13, fill: 0xaab3d0, stroke: { color: 0x000000, width: 2 } },
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

  // walk bob + facing, shared by own and remote avatars
  const animate = (a: Avatar, x: number, y: number, dir: string, now: number) => {
    const moving = Math.abs(x - a.lastX) > 0.1 || Math.abs(y - a.lastY) > 0.1
    a.root.position.set(x, y)
    a.body.y = moving ? Math.sin(now / 80) * 2.5 : 0
    face(a, dir)
    a.lastX = x
    a.lastY = y
  }

  app.ticker.add(() => {
    nightOverlay.alpha = darknessAt(dayPhase())
    const now = performance.now()
    if (own) {
      animate(own.avatar, own.state.x, own.state.y, own.state.dir, now)
      updateCamera(own.state.x, own.state.y, 0.12)
    }
    for (const { avatar, buf, state } of remotes.values()) {
      const pos = buf.sample(now)
      if (pos) animate(avatar, pos.x, pos.y, state.dir, now)
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
