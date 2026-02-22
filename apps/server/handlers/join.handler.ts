import type { AuthenticatedSocket } from "../types/ws.types"
import { joinRoom, leaveRoom, broadcast } from "../managers/roomManager"
import { addUser, removeUser, getUsers } from "../managers/presenceManager"

export function handleJoin(
  ws: AuthenticatedSocket,
  spaceId: string
) {
  if (!ws.userId) return

  if (ws.spaceId) {
    leaveRoom(ws.spaceId, ws)
    removeUser(ws.spaceId, ws.userId)

    broadcast(ws.spaceId, {
      type: "presence",
      users: getUsers(ws.spaceId),
    })
  }

  ws.spaceId = spaceId

  joinRoom(spaceId, ws)
  addUser(spaceId, ws.userId)

  broadcast(spaceId, {
    type: "presence",
    users: getUsers(spaceId),
  })
}