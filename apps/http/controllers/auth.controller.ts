import type { RequestHandler } from "express"
import { EmailSignupSchema, EmailSigninSchema } from "@repo/types"
import { signup, signin } from "../services/auth.service"
import { client } from "@repo/db"
import { signAccessToken } from "@repo/auth"
import { handleError } from "../utils/handleZodError"

const ACCESS_COOKIE = {
  httpOnly: true,
  maxAge: 1000 * 60 * 15,
}

const REFRESH_COOKIE = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * 7,
}

export const signupHandler: RequestHandler = async (req, res) => {
  try {
    const parsed = EmailSignupSchema.parse(req.body)
    const { accessToken, refreshToken } = await signup(
      parsed.email,
      parsed.password
    )

    res.cookie("accessToken", accessToken, ACCESS_COOKIE)
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE)

    return res.status(201).json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}

export const signinHandler: RequestHandler = async (req, res) => {
  try {
    const parsed = EmailSigninSchema.parse(req.body)
    const { accessToken, refreshToken } = await signin(
      parsed.email,
      parsed.password
    )

    res.cookie("accessToken", accessToken, ACCESS_COOKIE)
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE)

    return res.json({ success: true })
  } catch (error) {
    return handleError(res, error)
  }
}

export const refreshHandler: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken
  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const decoded: any = require("@repo/auth").verifyToken(refreshToken)

    const user = await client.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const newAccessToken = signAccessToken(user.id, user.role)

    res.cookie("accessToken", newAccessToken, ACCESS_COOKIE)

    return res.json({ success: true })
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" })
  }
}

export const logoutHandler: RequestHandler = async (_req, res) => {
  res.clearCookie("accessToken")
  res.clearCookie("refreshToken")
  return res.json({ success: true })
}

export const meHandler: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const user = await client.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      role: true,
      provider: true,
    },
  })

  return res.json(user)
}