import { WebSocketServer } from "ws"

const wss = new WebSocketServer({ port: 3001 })

const clients = new Set<any>()

wss.on("connection", (ws) => {
  clients.add(ws)

  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message.toString())
      }
    })
  })

  ws.on("close", () => {
    clients.delete(ws)
  })
})

console.log("WebSocket server running on ws://localhost:3001")
