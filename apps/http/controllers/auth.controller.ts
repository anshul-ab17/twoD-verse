import type { RequestHandler } from "express"
import { EmailSignupSchema, EmailSigninSchema } from "@repo/types"
import { signup, login } from "../services/auth.service"
import { handleError } from "../utils/handleZodError"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 1000 * 60 * 60 * 24 * 7,
}

export const signupHandler: RequestHandler = async (req, res) => {
  try {
    const parsed = EmailSignupSchema.parse(req.body)

    const token = await signup(parsed.email, parsed.password)

    res.cookie("token", token, COOKIE_OPTIONS)

    return res.status(201).json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}

export const loginHandler: RequestHandler = async (req, res) => {
  try {
    const parsed = EmailSigninSchema.parse(req.body)

    const token = await login(parsed.email, parsed.password)

    res.cookie("token", token, COOKIE_OPTIONS)

    return res.json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}
