import { z } from "zod"

export const CreateMapSchema = z.object({
  name: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  elements: z.array(
    z.object({
      elementId: z.string(),
      x: z.number().int(),
      y: z.number().int(),
    })
  ),
})
