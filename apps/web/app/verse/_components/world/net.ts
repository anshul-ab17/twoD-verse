/**
 * net.ts
 * Colyseus connector for the Pixi world. Owns the room, bridge emissions and
 * remote snapshot buffers; the scene consumes positions and sends intents.
 */
import { Client, getStateCallbacks, type Room } from "colyseus.js"
import {
  MSG, CHAT_BROADCAST, LEVEL_UP, SnapshotBuffer,
  type ChatBroadcast, type LevelUpBroadcast, type WorldRoomState, type PlayerState,
} from "@repo/game-core"
import { bridge } from "../../../../lib/bridge"

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:2567"

export type RemoteAvatar = { state: PlayerState; buf: SnapshotBuffer }

export type WorldNet = {
  room: Room<WorldRoomState>
  sessionId: string
  own: () => PlayerState | null
  remotes: ReadonlyMap<string, RemoteAvatar>
  /** registers the add callback and replays remotes that joined before the scene was ready */
  onRemoteAdd: (cb: (id: string, r: RemoteAvatar) => void) => void
  onRemoteRemove: (cb: (id: string) => void) => void
  sendMove: (dx: number, dy: number) => void
  sendChat: (text: string) => void
  leave: () => void
}

export async function connectWorld(token: string, character: string): Promise<WorldNet> {
  const room = await new Client(REALTIME_URL).joinOrCreate<WorldRoomState>("world", { token, character })
  bridge.emit("net:connected", { sessionId: room.sessionId })
  room.onLeave(() => bridge.emit("net:disconnected", undefined))
  room.onMessage(CHAT_BROADCAST, (m: ChatBroadcast) => bridge.emit("chat:message", m))
  room.onMessage(LEVEL_UP, (m: LevelUpBroadcast) => {
    if (m.sessionId === room.sessionId) bridge.emit("player:level-up", { level: m.level })
  })

  let ownState: PlayerState | null = null
  const remotes = new Map<string, RemoteAvatar>()
  let addCb: ((id: string, r: RemoteAvatar) => void) | null = null
  let removeCb: ((id: string) => void) | null = null

  const $ = getStateCallbacks(room)
  $(room.state).players.onAdd((p, id) => {
    if (id === room.sessionId) {
      ownState = p
      $(p).listen("zoneId", (zoneId) => bridge.emit("player:zone-changed", { zoneId }))
      $(p).listen("xp", (xp) => bridge.emit("player:xp-changed", { xp, level: p.level }))
      $(p).listen("level", (level) => bridge.emit("player:xp-changed", { xp: p.xp, level }))
      $(p).listen("questStep", (questStep) => bridge.emit("player:quest-changed", { questStep }))
      $(p).listen("streak", (streak) => bridge.emit("player:streak-changed", { streak }))
    } else {
      const buf = new SnapshotBuffer()
      buf.push({ t: performance.now(), x: p.x, y: p.y })
      $(p).onChange(() => buf.push({ t: performance.now(), x: p.x, y: p.y }))
      const r: RemoteAvatar = { state: p, buf }
      remotes.set(id, r)
      addCb?.(id, r)
    }
  })
  $(room.state).players.onRemove((_p, id) => {
    if (remotes.delete(id)) removeCb?.(id)
  })

  return {
    room,
    sessionId: room.sessionId,
    own: () => ownState,
    remotes,
    onRemoteAdd: (cb) => {
      addCb = cb
      for (const [id, r] of remotes) cb(id, r)
    },
    onRemoteRemove: (cb) => { removeCb = cb },
    sendMove: (dx, dy) => room.send(MSG.MOVE, { dx, dy }),
    sendChat: (text) => {
      const t = text.trim()
      if (t) room.send(MSG.CHAT, { text: t })
    },
    leave: () => void room.leave(),
  }
}
