import { z } from "zod"

export const CreateElementSchema = z.object({
  imageUrl: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  static: z.boolean().default(false),
})

export const AddElementSchema = z.object({
  spaceId: z.string(),
  elementId: z.string(),
  x: z.number().int(),
  y: z.number().int(),
})

export const DeleteElementSchema = z.object({
  id: z.string(),
})
