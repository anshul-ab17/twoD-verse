import { z } from "zod"

export const CreateAvatarSchema = z.object({
  imageUrl: z.string().url(),
  name: z.string().optional(),
})
