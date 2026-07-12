import { WebSocket } from "ws"
import { PrismaClient } from "@repo/db"
import { handleSpaceJoin } from "./handlers/space.handler"
import { handleMovement } from "./handlers/movement.handler"
import { handleGlobalChat, handleNearbyChat, handleDmChat } from "./handlers/chat.handler"
import { handleWebRTC } from "./handlers/webrtc.handler"
import type { AuthUser, IncomingMessage } from "./types"

const MAX_MESSAGE_LENGTH = 64 * 1024 // 64 KB (same as maxPayload — belt-and-suspenders)

export async function routeMessage(
  ws: WebSocket,
  prisma: PrismaClient,
  user: AuthUser,
  raw: string
) {
  // Reject oversized strings before JSON parsing
  if (raw.length > MAX_MESSAGE_LENGTH) return

  let message: IncomingMessage
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || !("type" in parsed)) return
    message = parsed as IncomingMessage
  } catch {
    // Silently drop malformed JSON — no need to surface an error to attackers
    return
  }

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

    case "chat:dm":
      await handleDmChat(ws, message.targetUserId, message.content)
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
