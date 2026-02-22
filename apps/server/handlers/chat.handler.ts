import type { AuthenticatedSocket } from "../types/ws.types"
import { broadcast } from "../managers/roomManager"

export function handleChat(
  ws: AuthenticatedSocket,
  content: string
) {
  if (!ws.spaceId || !ws.userId) return

  broadcast(ws.spaceId, {
    type: "chat",
    userId: ws.userId,
    content,
  })
}
