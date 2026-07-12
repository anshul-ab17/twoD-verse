import { WebSocket } from "ws"
import { playerManager } from "../managers/player.manager"
import { calculateDistance } from "../utils/distance"

const WEBRTC_PROXIMITY_LIMIT = 220

export function handleWebRTC(
  ws: WebSocket,
  type: "webrtc:offer" | "webrtc:answer" | "webrtc:ice",
  targetUserId: string,
  payload: any
) {
  const sender = playerManager.get(ws)
  if (!sender) return

  const target = playerManager.findByUserId(targetUserId)
  if (!target) return
  if (target.spaceId !== sender.spaceId) return
  if (sender.roomId === null || target.roomId === null) return
  if (sender.roomId !== target.roomId) return

  const distance = calculateDistance(
    sender.x,
    sender.y,
    target.x,
    target.y
  )
  if (distance > WEBRTC_PROXIMITY_LIMIT) return
  if (target.ws.readyState !== target.ws.OPEN) return

  target.ws.send(
    JSON.stringify({
      type,
      fromUserId: sender.userId,
      data: payload,
    })
  )
}
