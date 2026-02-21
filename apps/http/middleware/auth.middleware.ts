import type { RequestHandler } from "express"
import { verifyToken } from "@repo/auth"

export const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies?.accessToken

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}