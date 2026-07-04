import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod"
// subpath import: token.service only — index.ts drags in prisma/argon2 this service doesn't need
import { verifyToken } from "@verse/auth/token.service"

// Meeting notes from a chat transcript (plan §13, MVP wedge).
// ponytail: transcript comes from the client's chat log; server-side capture
// + LiveKit audio/STT pipeline are the upgrade path.
const NotesBody = z.object({
  zoneId: z.string().min(1),
  messages: z
    .array(z.object({ from: z.string(), text: z.string().max(500), ts: z.number() }))
    .min(1)
    .max(500),
})

const NotesSchema = z.object({
  summary: z.string(),
  actionItems: z.array(z.string()),
  decisions: z.array(z.string()),
})
export type MeetingNotes = z.infer<typeof NotesSchema>

const port = Number(process.env.AI_PORT) || 2570

async function generateNotes(body: z.infer<typeof NotesBody>): Promise<MeetingNotes> {
  const client = new Anthropic()
  const transcript = body.messages
    .map((m) => `[${new Date(m.ts).toISOString()}] ${m.from}: ${m.text}`)
    .join("\n")

  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system:
      "You summarize workplace meeting chat transcripts. Be faithful to the transcript; do not invent decisions or action items that were not discussed. Keep the summary to a few sentences.",
    messages: [
      {
        role: "user",
        content: `Meeting in zone "${body.zoneId}". Transcript:\n\n${transcript}`,
      },
    ],
    output_config: { format: zodOutputFormat(NotesSchema) },
  })
  if (!response.parsed_output) throw new Error("model returned no parsable notes")
  return response.parsed_output
}

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
    if (req.method !== "POST" || url.pathname !== "/v1/ai/notes") {
      return new Response("not found", { status: 404 })
    }

    // trust boundary: gateway access JWT required (mirrors apps/media)
    const auth = req.headers.get("authorization")
    if (!auth?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401)
    let payload: { userId?: string; jti?: string }
    try {
      payload = verifyToken(auth.slice(7))
    } catch {
      return json({ error: "unauthorized" }, 401)
    }
    if (!payload?.userId || payload.jti) return json({ error: "unauthorized" }, 401)

    const parsed = NotesBody.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return json({ error: parsed.error.issues }, 400)

    if (!process.env.ANTHROPIC_API_KEY) {
      return json({ error: "notes unavailable: ANTHROPIC_API_KEY not configured" }, 503)
    }

    try {
      return json(await generateNotes(parsed.data), 200)
    } catch (e) {
      console.error("notes generation failed:", e instanceof Error ? e.message : e)
      return json({ error: "notes generation failed" }, 502)
    }
  },
})

const json = (body: unknown, status: number) => Response.json(body, { status, headers: cors })
const cors = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Headers": "content-type, authorization",
} satisfies Record<string, string>

console.log(`@verse/ai notes service on :${port}`)
