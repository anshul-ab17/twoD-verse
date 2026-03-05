import "dotenv/config"
import http from "http"
import { WebSocketServer } from "ws"
import cookie from "cookie"

import { app } from "./app"
import { PORT } from "./config/env"
import { verifyToken } from "@repo/auth"
import { registerWSHandlers } from "./ws"
import { client } from "@repo/db"
import { connectRedis } from "@repo/pubsub"
import { initRedisSubscriber } from "./ws/redis.adapter"

const server = http.createServer(app)

const wss = new WebSocketServer({
  server,
  path: "/ws",
})

wss.on("connection", (ws, req) => {
  void (async () => {
    try {
      const rawCookie = req.headers.cookie
      if (!rawCookie) {
        ws.close(4401, "Missing cookies")
        return
      }

      const parsed = cookie.parse(rawCookie)
      const accessToken = parsed.accessToken
      const refreshToken = parsed.refreshToken

      let user: { userId: string; role: string } | null = null

      if (accessToken) {
        try {
          const decoded = verifyToken(accessToken)
          if (decoded?.userId && decoded?.role) {
            user = {
              userId: String(decoded.userId),
              role: String(decoded.role),
            }
          }
        } catch {
          // Fallback to refresh token below.
        }
      }

      if (!user && refreshToken) {
        try {
          const decoded = verifyToken(refreshToken)
          if (decoded?.userId) {
            const dbUser = await client.user.findUnique({
              where: { id: String(decoded.userId) },
              select: { id: true, role: true },
            })
            if (dbUser) {
              user = {
                userId: dbUser.id,
                role: dbUser.role,
              }
            }
          }
        } catch {
          // Invalid refresh token.
        }
      }

      if (!user) {
        ws.close(4401, "Unauthorized")
        return
      }

      registerWSHandlers(ws, client, user)
    } catch {
      ws.close(1011, "Internal WS auth error")
    }
  })()
})

async function bootstrap() {
  try {
    await connectRedis()
    await initRedisSubscriber()
    console.log("Redis connected")
  } catch (error) {
    console.error(
      "Redis connection failed. Continuing without cache/pubsub.",
      error
    )
  }

  server.listen(PORT, () => {
    console.log(`server's running on http://localhost:${PORT}`)
  })
}

void bootstrap()
