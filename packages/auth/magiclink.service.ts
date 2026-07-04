import { randomBytes, createHash } from "crypto"
import { client } from "@repo/db"

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createMagicLink(email: string) {
  const token = randomBytes(32).toString("hex")

  await client.magicLinkToken.create({
    data: {
      email,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    },
  })

  return token
}

export async function verifyMagicLink(token: string) {
  const tokenHash = hashToken(token)
  const now = new Date()

  // atomic consume: only succeeds if unconsumed and unexpired
  const { count } = await client.magicLinkToken.updateMany({
    where: { tokenHash, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  })
  if (count === 0) return null

  const row = await client.magicLinkToken.findUnique({ where: { tokenHash } })
  if (!row) return null

  return { email: row.email, userId: row.userId }
}
