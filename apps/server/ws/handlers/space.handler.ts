import { WebSocket } from "ws"
import { playerManager } from "../managers/player.manager"
import { spaceManager } from "../managers/space.manager"

import { PrismaClient } from "@repo/db"
import type { AuthUser } from "../types"

export async function handleSpaceJoin(
  ws: WebSocket,
  user: AuthUser,
  spaceId: string,
  prisma: PrismaClient
) {
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  })

  if (!space) return

  playerManager.add({
    userId: user.userId,
    spaceId,
    x: 100,
    y: 100,
    mapWidth: space.width,
    mapHeight: space.height,
    ws,
  })

  spaceManager.broadcast(spaceId, {
    type: "player:joined",
    userId: user.userId,
  })
}