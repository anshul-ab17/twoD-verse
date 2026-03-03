import { WebSocket } from "ws"
import { playerManager } from "../managers/player.manager"

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

  target.ws.send(
    JSON.stringify({
      type,
      fromUserId: sender.userId,
      data: payload,
    })
  )
}