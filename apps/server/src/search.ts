// Semantic search over world chat (plan §13): embed query via Voyage, cosine
// top-K in pgvector. BYOK: x-voyage-key header > VOYAGE_API_KEY env; 503 when
// neither is set, 502 when Voyage rejects the call.
import { Router, type Request, type Response, type NextFunction } from "express"
import { connectRedis, allow } from "@repo/pubsub"
import {
  resolveVoyageKey,
  embedTexts,
  searchWorldMessages,
  backfillWorldMessageEmbeddings,
} from "@repo/db"

type Middleware = (req: Request, res: Response, next: NextFunction) => void

const defaultDeps = {
  embed: embedTexts,
  search: searchWorldMessages,
  backfill: backfillWorldMessageEmbeddings,
  // degrade-open like authLimiter: redis down must not break search in dev
  limit: async (userId: string) => {
    try {
      await connectRedis()
      return await allow(userId, "search")
    } catch {
      return true
    }
  },
}

/** requireAuth comes from index.ts (sets req.userId); deps overridable for tests. */
export function searchRouter(requireAuth: Middleware, deps: Partial<typeof defaultDeps> = {}) {
  const { embed, search, backfill, limit } = { ...defaultDeps, ...deps }
  const r = Router()

  r.get("/v1/search", requireAuth, async (req, res) => {
    const userId = (req as Request & { userId: string }).userId
    if (!(await limit(userId))) return void res.status(429).json({ error: "too many searches" })

    const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
    if (!q) return void res.status(400).json({ error: "q required" })

    const key = resolveVoyageKey(req.header("x-voyage-key"))
    if (!key) return void res.status(503).json({ error: "search unavailable: no Voyage API key configured" })

    let vec: number[]
    try {
      ;[vec] = (await embed([q], key, "query")) as [number[]]
    } catch (e) {
      console.error("[search] embed failed:", e instanceof Error ? e.message : e)
      return void res.status(502).json({ error: "embedding provider error" })
    }
    res.json({ results: await search(vec, 10) })
  })

  // Idempotent backfill for rows written before a key existed (or while it was unset).
  r.post("/v1/search/backfill", requireAuth, async (req, res) => {
    const key = resolveVoyageKey(req.header("x-voyage-key"))
    if (!key) return void res.status(503).json({ error: "search unavailable: no Voyage API key configured" })
    try {
      res.json({ embedded: await backfill(key) })
    } catch (e) {
      console.error("[search] backfill failed:", e instanceof Error ? e.message : e)
      res.status(502).json({ error: "embedding provider error" })
    }
  })

  return r
}
