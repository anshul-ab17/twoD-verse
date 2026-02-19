import argon2 from "argon2"
import { signToken } from "@repo/auth"
import { client, AuthProvider } from "@repo/db" 

export async function signup(email: string, password: string) {
  const existing = await client.user.findUnique({
    where: { email },
  })

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

  return signToken(user.id)
}

export async function login(email: string, password: string) {
  const user = await client.user.findUnique({
    where: { email },
  })

  // Prevent account enumeration timing leaks
  if (!user || user.provider !== AuthProvider.EMAIL) {
    await fakeHashDelay()
    throw new Error("Invalid credentials")
  }

  if (!user.password) {
    throw new Error("Invalid credentials")
  }

  const valid = await argon2.verify(user.password, password)

  if (!valid) {
    throw new Error("Invalid credentials")
  }

  return signToken(user.id)
}

// Prevent timing attacks makes login time similar whether user exists or not
 
async function fakeHashDelay() {
  await argon2.hash("dummy-password")
}
