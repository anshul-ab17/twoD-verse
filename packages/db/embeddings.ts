// Voyage AI embeddings + pgvector search over WorldMessage (plan §13).
// Plain fetch, no SDK. Key: caller-supplied (BYOK x-voyage-key) > VOYAGE_API_KEY env.
// ponytail: WorldMessage only — meeting notes aren't persisted anywhere yet;
// embed them here when a notes table ships.
import { client } from "./client"

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings"
const MODEL = "voyage-3.5"
export const EMBED_DIM = 1024

/** BYOK header wins over server env; null = no key configured (503 at the route). */
export const resolveVoyageKey = (headerKey?: string | null) =>
  headerKey?.trim() || process.env.VOYAGE_API_KEY?.trim() || null

/** Embed texts via Voyage. Throws on any non-2xx (route maps it to 502). */
export async function embedTexts(
  texts: string[],
  apiKey: string,
  inputType: "document" | "query",
): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, input: texts, input_type: inputType, output_dimension: EMBED_DIM }),
  })
  if (!res.ok) throw new Error(`voyage ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const body = (await res.json()) as { data: { index: number; embedding: number[] }[] }
  return body.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

/** pgvector literal — passed as text param and cast with ::vector in SQL. */
export const toVectorLiteral = (v: number[]) => `[${v.join(",")}]`

/** Fire-and-forget write-path embed; silent no-op without a key, logs on failure. */
export function embedWorldMessage(id: string, text: string): void {
  const key = resolveVoyageKey()
  if (!key) return
  embedTexts([text], key, "document")
    .then(([v]) =>
      client.$executeRaw`UPDATE "WorldMessage" SET embedding = ${toVectorLiteral(v!)}::vector WHERE id = ${id}`,
    )
    .catch((e) => console.error("[embed] message embed failed:", e instanceof Error ? e.message : e))
}

export type SearchHit = {
  id: string
  text: string
  userId: string
  handle: string | null
  createdAt: Date
  score: number
}

/** Cosine top-K over embedded messages. ponytail: exact scan, no ANN index —
 * add HNSW when WorldMessage passes ~50k rows. */
export async function searchWorldMessages(queryVec: number[], k = 10): Promise<SearchHit[]> {
  const lit = toVectorLiteral(queryVec)
  return client.$queryRaw<SearchHit[]>`
    SELECT m.id, m.text, m."userId", u.handle, m."createdAt",
           1 - (m.embedding <=> ${lit}::vector) AS score
    FROM "WorldMessage" m
    LEFT JOIN "User" u ON u.id = m."userId"
    WHERE m.embedding IS NOT NULL
    ORDER BY m.embedding <=> ${lit}::vector
    LIMIT ${k}`
}

/** Idempotent: embeds rows where embedding IS NULL, batch of 100. Returns count. */
export async function backfillWorldMessageEmbeddings(apiKey: string): Promise<number> {
  let done = 0
  for (;;) {
    const rows = await client.$queryRaw<{ id: string; text: string }[]>`
      SELECT id, text FROM "WorldMessage" WHERE embedding IS NULL ORDER BY "createdAt" LIMIT 100`
    if (rows.length === 0) return done
    const vecs = await embedTexts(rows.map((r) => r.text), apiKey, "document")
    for (let i = 0; i < rows.length; i++) {
      await client.$executeRaw`UPDATE "WorldMessage" SET embedding = ${toVectorLiteral(vecs[i]!)}::vector WHERE id = ${rows[i]!.id}`
    }
    done += rows.length
  }
}
