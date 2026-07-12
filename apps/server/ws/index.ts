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
  ws.on("message", (data) => {
    // Catch synchronous throws and rejected promises so they don't become
    // unhandled rejections that leak memory and can crash the process.
    void routeMessage(ws, prisma, user, data.toString()).catch(() => { /* drop */ })
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
