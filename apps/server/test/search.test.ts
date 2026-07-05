// Unit tests for semantic search (plan §13): key resolution, Voyage client
// (mocked fetch), vector literal, and the /v1/search route with a mocked
// embedder. Run: bun test (from apps/server). bun:test, not vitest — vitest
// isn't installed in this workspace and the repo bans new installs mid-flight.
import { describe, it, expect, beforeEach, afterEach, afterAll } from "bun:test"
import express from "express"
import { resolveVoyageKey, embedTexts, toVectorLiteral } from "@repo/db"
import { searchRouter } from "../src/search"

const realFetch = globalThis.fetch
const savedEnvKey = process.env.VOYAGE_API_KEY

beforeEach(() => {
  delete process.env.VOYAGE_API_KEY
})
afterEach(() => {
  globalThis.fetch = realFetch
  if (savedEnvKey === undefined) delete process.env.VOYAGE_API_KEY
  else process.env.VOYAGE_API_KEY = savedEnvKey
})

describe("resolveVoyageKey", () => {
  it("returns null when neither header nor env is set", () => {
    expect(resolveVoyageKey(null)).toBeNull()
    expect(resolveVoyageKey("   ")).toBeNull()
  })
  it("falls back to env", () => {
    process.env.VOYAGE_API_KEY = "env-key"
    expect(resolveVoyageKey(undefined)).toBe("env-key")
  })
  it("header wins over env (BYOK precedent)", () => {
    process.env.VOYAGE_API_KEY = "env-key"
    expect(resolveVoyageKey(" header-key ")).toBe("header-key")
  })
})

describe("toVectorLiteral", () => {
  it("formats a pgvector literal", () => {
    expect(toVectorLiteral([1, -0.5, 2])).toBe("[1,-0.5,2]")
  })
})

describe("embedTexts", () => {
  it("POSTs to voyage with bearer key and returns embeddings ordered by index", async () => {
    let captured: { url: string; init: RequestInit } | null = null
    globalThis.fetch = (async (url: any, init: any) => {
      captured = { url: String(url), init }
      return Response.json({
        // deliberately out of order — client must sort by index
        data: [
          { index: 1, embedding: [3, 4] },
          { index: 0, embedding: [1, 2] },
        ],
      })
    }) as unknown as typeof fetch

    const vecs = await embedTexts(["a", "b"], "k123", "query")
    expect(vecs).toEqual([[1, 2], [3, 4]])
    expect(captured!.url).toBe("https://api.voyageai.com/v1/embeddings")
    expect((captured!.init.headers as Record<string, string>).authorization).toBe("Bearer k123")
    const body = JSON.parse(captured!.init.body as string)
    expect(body.input).toEqual(["a", "b"])
    expect(body.input_type).toBe("query")
    expect(body.output_dimension).toBe(1024)
  })

  it("throws on non-2xx", async () => {
    globalThis.fetch = (async () => new Response("bad key", { status: 401 })) as unknown as typeof fetch
    await expect(embedTexts(["x"], "bad", "document")).rejects.toThrow("voyage 401")
  })
})

// ---- route tests: real express server on an ephemeral port, mocked deps ----

const passAuth = (req: any, _res: any, next: any) => {
  req.userId = "u1"
  next()
}
const hit = {
  id: "m1", text: "standup at noon", userId: "u1", handle: "anshul",
  createdAt: new Date("2026-07-05T00:00:00Z"), score: 0.91,
}

// bun's node:http Server type clashes with express's under @types/bun — keep it structural
let server: ReturnType<express.Express["listen"]>
let base: string
const embedCalls: unknown[][] = []

function listen(app: express.Express): Promise<string> {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address() as { port: number }
      resolve(`http://127.0.0.1:${port}`)
    })
  })
}

describe("GET /v1/search", () => {
  beforeEach(async () => {
    embedCalls.length = 0
    const app = express()
    app.use(
      searchRouter(passAuth, {
        embed: async (...args: unknown[]) => {
          embedCalls.push(args)
          if ((args[1] as string) === "explode") throw new Error("voyage 401: nope")
          return [[0.1, 0.2, 0.3]]
        },
        search: async () => [hit],
        backfill: async () => 7,
        limit: async () => true,
      } as any),
    )
    base = await listen(app)
  })
  afterEach(() => server.close())

  it("503 when no key configured anywhere", async () => {
    const res = await realFetch(`${base}/v1/search?q=standup`)
    expect(res.status).toBe(503)
    expect(((await res.json()) as any).error).toContain("no Voyage API key")
  })

  it("400 when q missing", async () => {
    const res = await realFetch(`${base}/v1/search`, { headers: { "x-voyage-key": "k" } })
    expect(res.status).toBe(400)
  })

  it("200 happy path: embeds query with header key, returns hits", async () => {
    const res = await realFetch(`${base}/v1/search?q=standup`, { headers: { "x-voyage-key": "hdr" } })
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.results).toHaveLength(1)
    expect(body.results[0].text).toBe("standup at noon")
    expect(body.results[0].handle).toBe("anshul")
    // embedder got the query text, the resolved (header) key, input_type "query"
    expect(embedCalls[0]).toEqual([["standup"], "hdr", "query"])
  })

  it("502 when the embedder throws", async () => {
    const res = await realFetch(`${base}/v1/search?q=x`, { headers: { "x-voyage-key": "explode" } })
    expect(res.status).toBe(502)
  })

  it("backfill: 503 without key, 200 with", async () => {
    expect((await realFetch(`${base}/v1/search/backfill`, { method: "POST" })).status).toBe(503)
    const ok = await realFetch(`${base}/v1/search/backfill`, {
      method: "POST",
      headers: { "x-voyage-key": "k" },
    })
    expect(((await ok.json()) as any).embedded).toBe(7)
  })
})

afterAll(() => server?.close())
