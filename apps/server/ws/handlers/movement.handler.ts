import { WebSocket } from "ws"
import { playerManager } from "../managers/player.manager"
import { spaceManager } from "../managers/space.manager"
import { calculateDistance } from "../utils/distance"
import { allow } from "@repo/pubsub"
import { redis } from "@repo/pubsub"

const MAX_SPEED = 300

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
    // Allow movement in local/dev mode if Redis rate limiter is unavailable.
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

  // Proximity detection
  playerManager.getAll().forEach((target) => {
    if (target.userId === player.userId) return
    if (target.spaceId !== player.spaceId) return
    if (player.roomId === null || target.roomId === null) return
    if (player.roomId !== target.roomId) {
      ws.send(
        JSON.stringify({
          type: "proximity:update",
          targetUserId: target.userId,
          isClose: false,
        })
      )

      if (target.ws.readyState === target.ws.OPEN) {
        target.ws.send(
          JSON.stringify({
            type: "proximity:update",
            targetUserId: player.userId,
            isClose: false,
          })
        )
      }
      return
    }

    const d = calculateDistance(
      player.x,
      player.y,
      target.x,
      target.y
    )
    const isClose = d < 200

    ws.send(
      JSON.stringify({
        type: "proximity:update",
        targetUserId: target.userId,
        isClose,
      })
    )

    if (target.ws.readyState === target.ws.OPEN) {
      target.ws.send(
        JSON.stringify({
          type: "proximity:update",
          targetUserId: player.userId,
          isClose,
        })
      )
    }
  })
}
