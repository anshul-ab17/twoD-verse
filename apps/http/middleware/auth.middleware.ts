import type { RequestHandler } from "express"
import { verifyToken } from "@repo/auth"

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  try {
    const decoded = verifyToken(token)
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}
