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
  try {
    const rawCookie = req.headers.cookie

    if (!rawCookie) {
      ws.close()
      return
    }

    const parsed = cookie.parse(rawCookie)
    const token = parsed.accessToken

    if (!token) {
      ws.close()
      return
    }

    const user = verifyToken(token)

    registerWSHandlers(ws, client, user)

  } catch (err) {
    ws.close()
  }
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
