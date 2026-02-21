import argon2 from "argon2"
import {
  signAccessToken,
  signRefreshToken,
} from "@repo/auth"
import { client, AuthProvider } from "@repo/db"

export async function signup(email: string, password: string) {
  const existing = await client.user.findUnique({ where: { email } })

  if (existing) {
    throw new Error("User already exists")
  }

  const hashedPassword = await argon2.hash(password)

  const user = await client.user.create({
    data: {
      email,
      password: hashedPassword,
      provider: AuthProvider.EMAIL,
    },
  })

  return generateTokens(user.id, user.role)
}

export async function signin(email: string, password: string) {
  const user = await client.user.findUnique({ where: { email } })

  if (!user || user.provider !== AuthProvider.EMAIL || !user.password) {
    await fakeHashDelay()
    throw new Error("Invalid credentials")
  }

  const valid = await argon2.verify(user.password, password)

  if (!valid) {
    throw new Error("Invalid credentials")
  }

  return generateTokens(user.id, user.role)
}

function generateTokens(userId: string, role: string) {
  const accessToken = signAccessToken(userId, role)
  const refreshToken = signRefreshToken(userId)

  return { accessToken, refreshToken }
}

async function fakeHashDelay() {
  await argon2.hash("dummy-password")
}