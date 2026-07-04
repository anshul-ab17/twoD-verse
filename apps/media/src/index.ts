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

const cors = {
  "Access-Control-Allow-Origin": process.env.WEB_ORIGIN ?? "http://localhost:3000",
  "Access-Control-Allow-Headers": "content-type, authorization",
} satisfies Record<string, string>
const json = (body: unknown, status: number) => Response.json(body, { status, headers: cors })

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS" },
      })
    }
    if (req.method !== "POST" || url.pathname !== "/token") {
      return new Response("not found", { status: 404 })
    }

    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401)
    let payload: { userId?: string; jti?: string }
    try {
      payload = verifyToken(auth.slice(7))
    } catch {
      return json({ error: "unauthorized" }, 401)
    }
    // refresh tokens carry a jti — only access tokens accepted (mirrors gateway /v1/me)
    if (!payload?.userId || payload.jti) return json({ error: "unauthorized" }, 401)

    const parsed = TokenBody.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return json({ error: parsed.error.issues }, 400)
    }

    const token = await mintZoneToken({ identity: payload.userId, ...parsed.data })
    return json({ token, url: process.env.LIVEKIT_URL ?? "" }, 200)
  },
})

console.log(`@repo/media token service on :${port}`)
