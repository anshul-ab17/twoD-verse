import type { AuthenticatedSocket } from "../types/ws.types"
import { joinRoom, broadcast } from "../core/roomManager"
import { addUser, getUsers } from "../core/presenceManager"

export function handleJoin(
  ws: AuthenticatedSocket,
  spaceId: string
) {
  if (!ws.userId) return

  ws.spaceId = spaceId

  joinRoom(spaceId, ws)
  addUser(spaceId, ws.userId)

  broadcast(spaceId, {
    type: "presence",
    users: getUsers(spaceId),
  })
}
