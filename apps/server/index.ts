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

const ALLOWED_ORIGIN = process.env.WEB_BASE_URL || "http://localhost:3000"
const MAX_WS_PER_IP = 10

const server = http.createServer(app)

// Track concurrent WS connections per IP to limit connection floods
const wsConnectionsByIp = new Map<string, number>()

const wss = new WebSocketServer({
  server,
  path: "/ws",
  maxPayload: 64 * 1024, // 64 KB — prevents memory exhaustion from giant frames
})

wss.on("connection", (ws, req) => {
  // ── Origin check ──
  const origin = req.headers.origin
  if (origin && origin !== ALLOWED_ORIGIN) {
    ws.close(4403, "Forbidden origin")
    return
  }

  // ── Per-IP connection cap ──
  const ip = (req.socket.remoteAddress ?? "unknown").replace(/^::ffff:/, "")
  const current = wsConnectionsByIp.get(ip) ?? 0
  if (current >= MAX_WS_PER_IP) {
    ws.close(4429, "Too many connections from this IP")
    return
  }
  wsConnectionsByIp.set(ip, current + 1)
  ws.once("close", () => {
    const remaining = (wsConnectionsByIp.get(ip) ?? 1) - 1
    if (remaining <= 0) wsConnectionsByIp.delete(ip)
    else wsConnectionsByIp.set(ip, remaining)
  })

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
