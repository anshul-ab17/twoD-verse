import { WebSocket } from "ws"

export interface Player {
  userId: string
  spaceId: string
  x: number
  y: number
  hasSyncedInitialPosition: boolean
  roomId: number | null
  mapWidth: number
  mapHeight: number
  ws: WebSocket
}

class PlayerManager {
  private players = new Map<WebSocket, Player>()

  add(player: Player) {
    this.players.set(player.ws, player)
  }

  get(ws: WebSocket) {
    return this.players.get(ws)
  }

  remove(ws: WebSocket) {
    this.players.delete(ws)
  }

  getAll() {
    return this.players
  }

  findByUserId(userId: string) {
    for (const player of this.players.values()) {
      if (player.userId === userId) return player
    }
  }
}

export const playerManager = new PlayerManager()
