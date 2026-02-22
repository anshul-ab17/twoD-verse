import { verifyToken } from "@repo/auth"
import { MessageSchema } from "@repo/types"

import { allowMessage } from "./rateLimiter"
import { handleJoin } from "../handlers/join.handler"
import { handleMove } from "../handlers/move.handler"
import { handleChat } from "../handlers/chat.handler"
import { leaveRoom, broadcast } from "./roomManager"
import { removeUser, getUsers } from "./presenceManager"

import type { AuthenticatedSocket } from "../types/ws.types"

export function handleConnection(
  ws: AuthenticatedSocket,
  req: any
) {
  const url = new URL(req.url!, "http://localhost")
  const token = url.searchParams.get("token")

  if (!token) return ws.close()

  try {
    const decoded = verifyToken(token)
    ws.userId = decoded.userId
  } catch {
    return ws.close()
  }

  ws.isAlive = true

  ws.on("pong", () => {
    ws.isAlive = true
  })

  ws.on("message", (raw: Buffer) => {
    if (!ws.userId) return

    try {
      const data = JSON.parse(raw.toString())
      const parsed = MessageSchema.parse(data)

      const channel =
        parsed.type === "move"
          ? "move"
          : parsed.type === "chat"
          ? "chat"
          : "global"

      if (!allowMessage(ws.userId, channel)) return

      switch (parsed.type) {
        case "join":
          handleJoin(ws, parsed.spaceId)
          break
        case "move":
          handleMove(ws, parsed.x, parsed.y)
          break
        case "chat":
          handleChat(ws, parsed.content)
          break
      }
    } catch {
      return
    }
  })

  ws.on("close", () => {
    if (ws.spaceId && ws.userId) {
      leaveRoom(ws.spaceId, ws)
      removeUser(ws.spaceId, ws.userId)

      broadcast(ws.spaceId, {
        type: "presence",
        users: getUsers(ws.spaceId),
      })
    }
  })
}