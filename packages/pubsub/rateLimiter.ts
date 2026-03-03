
import { redis } from "./client"

export async function allow(
  userId: string,
  type: "move" | "chat" | "global"
) {
  const key = `rt:rate:${type}:${userId}`

  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, 1)
  }

  switch (type) {
    case "move":
      return count <= 20
    case "chat":
      return count <= 3
    case "global":
      return count <= 40
    default:
      return false
  }
}