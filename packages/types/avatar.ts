import { z } from "zod"

export const CreateAvatarSchema = z.object({
  imageUrl: z.url(),
  name: z.string().optional(),
})
