import { z } from "zod"
import { mintZoneToken } from "./token"

// ponytail: real version authenticates via @verse/auth access JWT and derives
// identity from it — spike takes identity on faith from the request body.

const TokenBody = z.object({
  identity: z.string().min(1),
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

    const parsed = TokenBody.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 })
    }

    const token = await mintZoneToken(parsed.data)
    return Response.json({ token, url: process.env.LIVEKIT_URL ?? "" })
  },
})

console.log(`@verse/media token service on :${port}`)
