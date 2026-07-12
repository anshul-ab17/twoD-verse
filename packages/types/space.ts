import { z } from "zod"

export const CreateSpaceSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  mapId: z.string().optional(),
})

export const UpdateSpaceSchema = z.object({
  name: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export type CreateSpaceInput = z.infer<typeof CreateSpaceSchema>
