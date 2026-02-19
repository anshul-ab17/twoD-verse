import { z } from "zod"

export const JoinSchema = z.object({
  type: z.literal("join"),
  spaceId: z.string(),
})

export const MoveSchema = z.object({
  type: z.literal("move"),
  x: z.number(),
  y: z.number(),
})

export const ChatSchema = z.object({
  type: z.literal("chat"),
  content: z.string().min(1).max(500),
})

export const MessageSchema = z.discriminatedUnion("type", [
  JoinSchema,
  MoveSchema,
  ChatSchema,
])
