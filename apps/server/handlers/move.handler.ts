import type { AuthenticatedSocket } from "../types/ws.types"
import { broadcast } from "../core/roomManager"

const MAX_X = 2000
const MAX_Y = 2000

const MAX_DELTA = 100

export function handleMove(
  ws: AuthenticatedSocket,
  x: number,
  y: number
) {
  if (!ws.spaceId || !ws.userId) return

  // Boundary validation
  if (x < 0 || x > MAX_X) return
  if (y < 0 || y > MAX_Y) return

  // Anti-teleport validation
  if (ws.lastX !== undefined && ws.lastY !== undefined) {
    const dx = Math.abs(x - ws.lastX)
    const dy = Math.abs(y - ws.lastY)

    if (dx > MAX_DELTA || dy > MAX_DELTA) {
      return 
    }
  }

  ws.lastX = x
  ws.lastY = y

  broadcast(ws.spaceId, {
    type: "playerMoved",
    userId: ws.userId,
    x,
    y,
  })
}
