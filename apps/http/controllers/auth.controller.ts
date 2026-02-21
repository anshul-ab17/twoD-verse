import type { RequestHandler } from "express"
import { EmailSignupSchema, EmailSigninSchema } from "@repo/types"
import { signup, signin } from "../services/auth.service"
import { client } from "@repo/db"
import {
  verifyToken,
  signAccessToken,
  signRefreshToken,
} from "@repo/auth"
import { redis } from "@repo/pubsub"
import { handleError } from "../utils/handleZodError"

const isProd = process.env.NODE_ENV === "production"

const ACCESS_COOKIE = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: 1000 * 60 * 15,
}

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
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
  const token = req.cookies?.refreshToken
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const decoded = verifyToken(token)

    if (!decoded.jti || !decoded.userId) {
      return res.status(401).json({ error: "Invalid token" })
    }

    const exists = await redis.get(`refresh:${decoded.jti}`)

    if (!exists) {
      // Token reuse detected
      await redis.del(`sessions:${decoded.userId}`)
      return res.status(403).json({ error: "Token reuse detected" })
    }

    // Delete old refresh token
    await redis.del(`refresh:${decoded.jti}`)
    await redis.sRem(`sessions:${decoded.userId}`, decoded.jti)

    const user = await client.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const newAccessToken = signAccessToken(user.id, user.role)
    const { token: newRefreshToken, jti } =
      signRefreshToken(user.id)

    await redis.set(`refresh:${jti}`, user.id, {
      EX: 60 * 60 * 24 * 7,
    })

    await redis.sAdd(`sessions:${user.id}`, jti)

    res.cookie("accessToken", newAccessToken, ACCESS_COOKIE)
    res.cookie("refreshToken", newRefreshToken, REFRESH_COOKIE)

    return res.json({ success: true })
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" })
  }
}

export const logoutHandler: RequestHandler = async (req, res) => {
  const token = req.cookies?.refreshToken

  if (token) {
    try {
      const decoded = verifyToken(token)

      if (decoded.jti && decoded.userId) {
        await redis.del(`refresh:${decoded.jti}`)
        await redis.sRem(
          `sessions:${decoded.userId}`,
          decoded.jti
        )
      }
    } catch {
      // ignore invalid token
    }
  }

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
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  })

  return res.json(user)
}
export const revokeSessionHandler: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { jti } = req.params

  if (!jti) {
    return res.status(400).json({ error: "Missing session id" })
  }

  await redis.del(`refresh:${jti}`)
  await redis.sRem(`sessions:${req.user.userId}`, jti)

  return res.json({ success: true })
}