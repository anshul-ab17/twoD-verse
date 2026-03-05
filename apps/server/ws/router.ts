import { WebSocket } from "ws"
import { PrismaClient } from "@repo/db"
import { handleSpaceJoin } from "./handlers/space.handler"
import { handleMovement } from "./handlers/movement.handler"
import { handleGlobalChat, handleNearbyChat } from "./handlers/chat.handler"
import { handleWebRTC } from "./handlers/webrtc.handler"
import type { AuthUser, IncomingMessage } from "./types"

export async function routeMessage(
  ws: WebSocket,
  prisma: PrismaClient,
  user: AuthUser,
  raw: string
) {
  const message: IncomingMessage = JSON.parse(raw)

  switch (message.type) {
    case "space:join":
      await handleSpaceJoin(ws, user, message.spaceId, prisma)
      break

    case "player:move":
      await handleMovement(ws, message.x, message.y, message.roomId)
      break

    case "chat:global":
      await handleGlobalChat(ws, prisma, message.content)
      break

    case "chat:nearby":
      await handleNearbyChat(ws, message.content)
      break

    case "webrtc:offer":
      handleWebRTC(ws, message.type, message.targetUserId, message.offer)
      break

    case "webrtc:answer":
      handleWebRTC(ws, message.type, message.targetUserId, message.answer)
      break

    case "webrtc:ice":
      handleWebRTC(ws, message.type, message.targetUserId, message.candidate)
      break
  }
}
