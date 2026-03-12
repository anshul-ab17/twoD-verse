import { WebSocket } from "ws"
import { playerManager } from "../managers/player.manager"
import { spaceManager } from "../managers/space.manager"
import { calculateDistance } from "../utils/distance"
import { allow } from "@repo/pubsub"
import { redis } from "@repo/pubsub"

const MAX_SPEED = 300

function sendProximity(ws: WebSocket, targetUserId: string, isClose: boolean) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: "proximity:update", targetUserId, isClose }))
  }
}

function computeIsClose(
  ax: number, ay: number, aRoomId: number | null,
  bx: number, by: number, bRoomId: number | null,
): boolean {
  // Both players have a known room: same room = connect, different room = disconnect
  if (aRoomId !== null && bRoomId !== null) {
    if (aRoomId !== bRoomId) return false
    // Same room — always close (room-based WebRTC)
    return true
  }
  // At least one player's room is unknown — fall back to pixel distance
  return calculateDistance(ax, ay, bx, by) < 200
}

export async function handleMovement(
  ws: WebSocket,
  x: number,
  y: number,
  roomId?: number
) {
  const player = playerManager.get(ws)
  if (!player) return

  let allowed = true
  try {
    allowed = await allow(player.userId, "move")
  } catch {
    allowed = true
  }
  if (!allowed) return

  if (!Number.isFinite(x) || !Number.isFinite(y)) return
  if (x < 0 || y < 0) return

  const dx = x - player.x
  const dy = y - player.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const initialSync = !player.hasSyncedInitialPosition

  if (!initialSync && distance > MAX_SPEED) return

  player.x = x
  player.y = y
  player.hasSyncedInitialPosition = true
  player.roomId = Number.isFinite(roomId) ? Math.trunc(roomId as number) : null

  try {
    await redis.set(
      `rt:player:${player.userId}`,
      JSON.stringify({ x, y, spaceId: player.spaceId, roomId: player.roomId }),
      { EX: 3600 }
    )
  } catch {
    // Ignore cache failures in local/dev mode.
  }

  await spaceManager.broadcast(player.spaceId, {
    type: "player:moved",
    userId: player.userId,
    x,
    y,
    roomId: player.roomId,
  })

  // Proximity detection — runs for every move
  playerManager.getAll().forEach((target) => {
    if (target.userId === player.userId) return
    if (target.spaceId !== player.spaceId) return

    const isClose = computeIsClose(
      player.x, player.y, player.roomId,
      target.x, target.y, target.roomId,
    )

    sendProximity(ws, target.userId, isClose)
    sendProximity(target.ws, player.userId, isClose)
  })
}

/** Call after a player joins to immediately evaluate proximity against all existing players. */
export function broadcastProximityOnJoin(ws: WebSocket) {
  const player = playerManager.get(ws)
  if (!player) return

  playerManager.getAll().forEach((target) => {
    if (target.userId === player.userId) return
    if (target.spaceId !== player.spaceId) return

    const isClose = computeIsClose(
      player.x, player.y, player.roomId,
      target.x, target.y, target.roomId,
    )

    sendProximity(ws, target.userId, isClose)
    sendProximity(target.ws, player.userId, isClose)
  })
}
