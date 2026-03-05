import argon2 from "argon2"
import {
  signAccessToken,
  signRefreshToken,
} from "@repo/auth"
import { client } from "@repo/db"
import { redis } from "@repo/pubsub"

export async function signup(email: string, password: string) {
  const existing = await client.user.findUnique({
    where: { email },
  })

  if (existing) {
    throw new Error("User already exists")
  }

  const hashed = await argon2.hash(password)

  const user = await client.user.create({
    data: {
      email,
      password: hashed,
      accounts: {
        create: {
          provider: "EMAIL",
          providerId: email,
        },
      },
    },
  })

  return generateTokens(user.id, user.role)
}

export async function signin(email: string, password: string) {
  const user = await client.user.findUnique({
    where: { email },
    include: { accounts: true },
  })

  if (!user || !user.password) {
    await argon2.hash("fake-password")
    throw new Error("Invalid credentials")
  }

  const emailAccount = user.accounts.find(
    (acc) => acc.provider === "EMAIL"
  )

  if (!emailAccount) {
    await argon2.hash("fake-password")
    throw new Error("Invalid credentials")
  }

  const valid = await argon2.verify(user.password, password)

  if (!valid) throw new Error("Invalid credentials")

  return generateTokens(user.id, user.role)
}

async function generateTokens(userId: string, role: string) {
  const accessToken = signAccessToken(userId, role)
  const { token: refreshToken, jti } = signRefreshToken(userId)

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  )

  await Promise.all([
    client.session.create({
      data: {
        userId,
        jti,
        expiresAt,
      },
    }),
    redis.set(`refresh:${jti}`, userId, {
      EX: 60 * 60 * 24 * 7,
    }),
    redis.sAdd(`sessions:${userId}`, jti),
  ])

  return { accessToken, refreshToken }
}
