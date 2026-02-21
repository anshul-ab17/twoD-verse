import { pub } from "./client"

export async function allow(
  userId: string,
  type: "move" | "chat" | "global"
) {
  const key = `rate:${type}:${userId}`

  const count = await pub.incr(key)

  if (count === 1) {
    await pub.expire(key, 1) // 1 second window
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