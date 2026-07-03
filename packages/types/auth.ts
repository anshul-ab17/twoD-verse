import { z } from "zod" 

export const EmailSignupSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include uppercase")
    .regex(/[0-9]/, "Must include number")
    .regex(/[^A-Za-z0-9]/, "Must include special character"),
})

export const EmailSigninSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})
 

export const OAuthSigninSchema = z.object({
  provider: z.enum(["google", "github"]),
})
 

export const UpdateProfileSchema = z.object({
  avatarId: z.string().optional(),
  name: z.string().min(1).optional(),
})
 

export type EmailSignupInput = z.infer<typeof EmailSignupSchema>
export type EmailSigninInput = z.infer<typeof EmailSigninSchema>
export type OAuthSigninInput = z.infer<typeof OAuthSigninSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
