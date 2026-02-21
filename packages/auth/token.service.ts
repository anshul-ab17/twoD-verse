import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

export function signAccessToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" })
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    userId: string
    role?: string
  }
}