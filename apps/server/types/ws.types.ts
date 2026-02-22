import { WebSocket } from "ws"
export type ClientMessage =
  | { type: "join"; spaceId: string }
  | { type: "move"; x: number; y: number }
  | { type: "chat"; content: string }

export type ServerMessage =
  | { type: "joined" }
  | { type: "playerMoved"; userId: string; x: number; y: number }
  | { type: "chat"; userId: string; content: string }
  | { type: "presence"; users: string[] }


export interface AuthenticatedSocket extends WebSocket {
  userId?: string
  spaceId?: string
  isAlive?: boolean
  lastX?: number
  lastY?: number
}
