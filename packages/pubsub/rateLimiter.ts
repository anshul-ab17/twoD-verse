import { pub } from "./client"

export async function allow(userId: string, type: string) {
  const key = `rate:${type}:${userId}`
  const count = await pub.incr(key)
  if (count === 1) await pub.expire(key, 1)
  if (type === "move" && count > 20) return false
  if (type === "chat" && count > 3) return false
  if (type === "global" && count > 40) return false
  return true
}
