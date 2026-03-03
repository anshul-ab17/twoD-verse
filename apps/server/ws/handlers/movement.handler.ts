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
  y: number
) {
  const player = playerManager.get(ws)
  if (!player) return

  const allowed = await allow(player.userId, "move")
  if (!allowed) return

  // Boundary validation
  if (x < 0 || y < 0) return
  if (x > player.mapWidth || y > player.mapHeight) return

  const dx = x - player.x
  const dy = y - player.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance > MAX_SPEED) return

  player.x = x
  player.y = y

  await redis.set(
    `rt:player:${player.userId}`,
    JSON.stringify({ x, y, spaceId: player.spaceId }),
    { EX: 3600 }
  )

  await spaceManager.broadcast(player.spaceId, {
    type: "player:moved",
    userId: player.userId,
    x,
    y,
  })

  // Proximity detection
  playerManager.getAll().forEach((target) => {
    if (target.userId === player.userId) return
    if (target.spaceId !== player.spaceId) return

    const d = calculateDistance(
      player.x,
      player.y,
      target.x,
      target.y
    )

    ws.send(
      JSON.stringify({
        type: "proximity:update",
        targetUserId: target.userId,
        isClose: d < 200,
      })
    )
  })
}