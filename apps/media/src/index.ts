import { z } from "zod"
// subpath import: token.service only — index.ts drags in prisma/argon2 this service doesn't need
import { verifyToken } from "@repo/auth/token.service"
import { mintZoneToken } from "./token"

// identity comes from the access JWT (plan §6) — client-supplied identity is ignored
const TokenBody = z.object({
  zoneId: z.string().min(1),
  canPublish: z.boolean().optional().default(true),
})

const port = Number(process.env.MEDIA_PORT) || 2568

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    if (req.method !== "POST" || url.pathname !== "/token") {
      return new Response("not found", { status: 404 })
    }

    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) return Response.json({ error: "unauthorized" }, { status: 401 })
    let payload: { userId?: string; jti?: string }
    try {
      payload = verifyToken(auth.slice(7))
    } catch {
      return Response.json({ error: "unauthorized" }, { status: 401 })
    }
    // refresh tokens carry a jti — only access tokens accepted (mirrors gateway /v1/me)
    if (!payload?.userId || payload.jti) return Response.json({ error: "unauthorized" }, { status: 401 })

    const parsed = TokenBody.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 })
    }

    const token = await mintZoneToken({ identity: payload.userId, ...parsed.data })
    return Response.json({ token, url: process.env.LIVEKIT_URL ?? "" })
  },
})

console.log(`@repo/media token service on :${port}`)
