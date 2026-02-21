import type { RequestHandler } from "express"
import { EmailSignupSchema, EmailSigninSchema } from "@repo/types"
import { signup, signin } from "../services/auth.service"
import { client } from "@repo/db"
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

export const signinHandler: RequestHandler = async (req, res) => {
  try {
    const parsed = EmailSigninSchema.parse(req.body)

    const token = await signin(parsed.email, parsed.password)

    res.cookie("token", token, COOKIE_OPTIONS)

    return res.json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}

export const logoutHandler: RequestHandler = async (_req, res) => {
  res.clearCookie("token")
  return res.json({ success: true })
}

export const meHandler: RequestHandler = async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const user = await client.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, role: true },
  })

  return res.json(user)
}