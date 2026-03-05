import { WebSocket } from "ws"
import { PrismaClient } from "@repo/db"
import { routeMessage } from "./router"
import { playerManager } from "./managers/player.manager"
import { spaceManager } from "./managers/space.manager"

export async function registerWSHandlers(
  ws: WebSocket,
  prisma: PrismaClient,
  user: any
) {
  ws.on("message", async (data) => {
    await routeMessage(ws, prisma, user, data.toString())
  })

  ws.on("close", () => {
    const player = playerManager.get(ws)
    if (player) {
      playerManager.remove(ws)
      void spaceManager.broadcast(player.spaceId, {
        type: "player:left",
        userId: player.userId,
      })
    }
  })
}
