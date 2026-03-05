export type IncomingMessage =
  | { type: "space:join"; spaceId: string }
  | { type: "player:move"; x: number; y: number; roomId?: number }
  | { type: "chat:global"; content: string }
  | { type: "chat:nearby"; content: string }
  | { type: "webrtc:offer"; targetUserId: string; offer: any }
  | { type: "webrtc:answer"; targetUserId: string; answer: any }
  | { type: "webrtc:ice"; targetUserId: string; candidate: any }

export interface AuthUser {
  userId: string
  role: string
}
