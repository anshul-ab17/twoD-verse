export type WSIncoming =
  | { type: "space:join"; spaceId: string }
  | { type: "player:move"; x: number; y: number; roomId?: number }
  | { type: "chat:global"; content: string }
  | { type: "chat:nearby"; content: string }
  | { type: "webrtc:offer"; targetUserId: string; offer: any }
  | { type: "webrtc:answer"; targetUserId: string; answer: any }
  | { type: "webrtc:ice"; targetUserId: string; candidate: any }

export type WSOutgoing =
  | { type: "space:state"; players: { userId: string; x: number; y: number; roomId: number | null }[] }
  | { type: "player:joined"; userId: string; x: number; y: number; roomId: number | null }
  | { type: "player:moved"; userId: string; x: number; y: number; roomId: number | null }
  | { type: "player:left"; userId: string }
  | { type: "chat:global"; userId: string; content: string }
  | { type: "chat:nearby"; userId: string; content: string }
  | { type: "proximity:update"; targetUserId: string; isClose: boolean }
  | {
      type: "webrtc:offer" | "webrtc:answer" | "webrtc:ice"
      fromUserId: string
      data: any
    }
