import type { RequestHandler } from "express"
import { client } from "@repo/db"

export const batchUsers: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })
  const raw = typeof req.query.ids === "string" ? req.query.ids : ""
  const ids = raw.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 50)
  if (ids.length === 0) return res.json({ users: [] })
  const users = await client.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true },
  })
  return res.json({ users })
}

export const searchUsers: RequestHandler = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" })

  const q = typeof req.query.q === "string" ? req.query.q.trim() : ""
  if (q.length < 2) return res.json({ users: [] })

  // Use Postgres full-text search (tsvector) for whole-word matches
  // combined with trigram ILIKE for partial prefix matches — union both
  const users = await client.$queryRaw<{ id: string; email: string }[]>`
    SELECT id, email FROM "User"
    WHERE
      id != ${req.user.userId}
      AND (
        search_vector @@ plainto_tsquery('english', ${q})
        OR email ILIKE ${'%' + q + '%'}
      )
    ORDER BY
      ts_rank(search_vector, plainto_tsquery('english', ${q})) DESC,
      similarity(email, ${q}) DESC
    LIMIT 20
  `

  return res.json({ users })
}
