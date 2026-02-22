import { WebSocketServer } from "ws"
import { handleConnection } from "./managers/connectionManager"
import type { AuthenticatedSocket } from "./types/ws.types"

const wss = new WebSocketServer({ port: 8080 })

wss.on("connection", (ws: AuthenticatedSocket, req) => {
  handleConnection(ws, req)
})

setInterval(() => {
  wss.clients.forEach((ws: any) => {
    if (!ws.isAlive) return ws.terminate()

    ws.isAlive = false
    ws.ping()
  })
}, 30000)
