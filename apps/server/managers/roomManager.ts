import { WebSocket } from "ws"

const rooms = new Map<string, Set<WebSocket>>()

export function joinRoom(spaceId: string, ws: WebSocket) {
  if (!rooms.has(spaceId)) {
    rooms.set(spaceId, new Set())
  }
  rooms.get(spaceId)!.add(ws)
}

export function leaveRoom(spaceId: string, ws: WebSocket) {
  rooms.get(spaceId)?.delete(ws)

  if (rooms.get(spaceId)?.size === 0) {
    rooms.delete(spaceId)
  }
}

export function broadcast(spaceId: string, payload: unknown) {
  const clients = rooms.get(spaceId)
  if (!clients) return

  const data = JSON.stringify(payload)

  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(data)
    }
  }
}
