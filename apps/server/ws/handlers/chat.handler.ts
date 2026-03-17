import { WebSocket } from "ws"
import { PrismaClient } from "@repo/db"
import { playerManager } from "../managers/player.manager"
import { spaceManager } from "../managers/space.manager"
import { allow } from "@repo/pubsub"
import { calculateDistance } from "../utils/distance"

export async function handleGlobalChat(
  ws: WebSocket,
  prisma: PrismaClient,
  content: string
) {
  const player = playerManager.get(ws)
  if (!player) return

  const allowed = await allow(player.userId, "chat")
  if (!allowed) return

  await prisma.message.create({
    data: {
      content,
      userId: player.userId,
      spaceId: player.spaceId,
    },
  })

  await spaceManager.broadcast(player.spaceId, {
    type: "chat:global",
    userId: player.userId,
    content,
  })
}

export async function handleDmChat(
  ws: WebSocket,
  targetUserId: string,
  content: string
) {
  const sender = playerManager.get(ws)
  if (!sender) return

  const allowed = await allow(sender.userId, "chat")
  if (!allowed) return

  const target = playerManager.findByUserId(targetUserId)
  if (!target) return

  target.ws.send(
    JSON.stringify({
      type: "chat:dm",
      fromUserId: sender.userId,
      content,
    })
  )
}

export async function handleNearbyChat(
  ws: WebSocket,
  content: string
) {
  const sender = playerManager.get(ws)
  if (!sender) return

  const allowed = await allow(sender.userId, "chat")
  if (!allowed) return

  playerManager.getAll().forEach((target) => {
    if (target.spaceId !== sender.spaceId) return
    if (sender.roomId === null || target.roomId === null) return
    if (sender.roomId !== target.roomId) return

    const distance = calculateDistance(
      sender.x,
      sender.y,
      target.x,
      target.y
    )

    if (distance < 150) {
      target.ws.send(
        JSON.stringify({
          type: "chat:nearby",
          userId: sender.userId,
          content,
        })
      )
    }
  })
}
