import jwt from "jsonwebtoken"
import { randomUUID } from "crypto"

const JWT_SECRET = process.env.JWT_SECRET!

export function signAccessToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: "15m",
  })
}

export function signRefreshToken(userId: string) {
  const jti = randomUUID()

  const token = jwt.sign({ userId, jti }, JWT_SECRET, {
    expiresIn: "7d",
  })

  return { token, jti }
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as any
}