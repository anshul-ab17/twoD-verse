export type ClientMessage =
  | { type: "join"; spaceId: string }
  | { type: "move"; x: number; y: number }
  | { type: "chat"; content: string }

export type ServerMessage =
  | { type: "joined" }
  | { type: "playerMoved"; userId: string; x: number; y: number }
  | { type: "chat"; userId: string; content: string }
