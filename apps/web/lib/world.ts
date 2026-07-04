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
  SnapshotBuffer,
  type ChatBroadcast,
  type WorldRoomState,
  type PlayerState,
} from "@verse/net-schema"
import { bridge } from "./bridge"

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:2567"

const PALETTE = [0xe4572e, 0x29c7ac, 0xf3a712, 0x5b8dee, 0xc74fd1, 0x8bc34a, 0xff7eb6, 0x00bcd4]

function colorFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]!
}

function makeAvatar(id: string, own: boolean): Container {
  const c = new Container()
  const g = new Graphics().circle(0, 0, 14).fill(colorFor(id))
  if (own) g.circle(0, 0, 17).stroke({ width: 3, color: 0xffffff })
  const label = new Text({ text: id, style: { fontSize: 12, fill: 0xffffff } })
  label.anchor.set(0.5)
  label.y = -28
  c.addChild(g, label)
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
  // ponytail: no camera/viewport — whole 1600x1200 world in one canvas,
  // scaled by CSS. Add a follow-camera when the world outgrows a screen.
  await app.init({ width: WORLD.width, height: WORLD.height, background: 0x1b1e2b })
  app.canvas.style.maxWidth = "100%"
  app.canvas.style.height = "auto"
  el.appendChild(app.canvas)

  const zoneLayer = new Graphics()
  for (const z of SPIKE_ZONES) {
    const tint = z.kind === "voice" ? 0x2e7d5b : 0x3a3f58
    zoneLayer
      .rect(z.bounds.x, z.bounds.y, z.bounds.w, z.bounds.h)
      .fill({ color: tint, alpha: 0.5 })
  }
  app.stage.addChild(zoneLayer)

  const playerLayer = new Container()
  app.stage.addChild(playerLayer)

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

  const $ = getStateCallbacks(room)
  const remotes = new Map<string, { sprite: Container; buf: SnapshotBuffer }>()
  let own: { sprite: Container; state: PlayerState } | null = null

  $(room.state).players.onAdd((p, id) => {
    // p.id = JWT identity (label); map key `id` stays the sessionId
    const sprite = makeAvatar(p.id, id === room.sessionId)
    sprite.position.set(p.x, p.y)
    playerLayer.addChild(sprite)

    if (id === room.sessionId) {
      // ponytail: no client-side prediction — own avatar rendered straight
      // from server state (~1 RTT input lag). Add prediction+reconciliation
      // if movement feels mushy.
      own = { sprite, state: p }
      $(p).listen("zoneId", (zoneId) => bridge.emit("player:zone-changed", { zoneId }))
    } else {
      // render remotes 100ms in the past, lerped between server snapshots
      const buf = new SnapshotBuffer()
      buf.push({ t: performance.now(), x: p.x, y: p.y })
      remotes.set(id, { sprite, buf })
      $(p).onChange(() => buf.push({ t: performance.now(), x: p.x, y: p.y }))
    }
  })

  $(room.state).players.onRemove((_p, id) => {
    const r = remotes.get(id)
    if (r) {
      r.sprite.destroy()
      remotes.delete(id)
    }
  })

  app.ticker.add(() => {
    if (own) own.sprite.position.set(own.state.x, own.state.y)
    const now = performance.now()
    for (const { sprite, buf } of remotes.values()) {
      const pos = buf.sample(now)
      if (pos) sprite.position.set(pos.x, pos.y)
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
