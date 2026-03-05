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

  const existingPlayers = Array.from(playerManager.getAll().values())
    .filter((player) => player.spaceId === spaceId && player.userId !== user.userId)
    .map((player) => ({
      userId: player.userId,
      x: player.x,
      y: player.y,
      roomId: player.roomId,
    }))

  playerManager.add({
    userId: user.userId,
    spaceId,
    x: 100,
    y: 100,
    hasSyncedInitialPosition: false,
    roomId: null,
    mapWidth: space.width,
    mapHeight: space.height,
    ws,
  })

  if (ws.readyState === ws.OPEN) {
    ws.send(
      JSON.stringify({
        type: "space:state",
        players: existingPlayers,
      })
    )
  }

  await spaceManager.broadcast(spaceId, {
    type: "player:joined",
    userId: user.userId,
    x: 100,
    y: 100,
    roomId: null,
  })
}
