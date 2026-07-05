import { redis } from "./client"

const LIMITS: Record<"move" | "chat" | "global" | "auth" | "search", number> = {
  move: 20,
  chat: 3,
  global: 40,
  auth: 5, // per-IP auth attempts per second (login/signup/magic-link)
  search: 3, // per-user semantic searches per second (each one costs a Voyage call)
}

// Atomic INCR + conditional EXPIRE in a single Lua script.
// This eliminates the race where the process could crash between INCR and EXPIRE,
// which would leave the key with no TTL and permanently block the user.
// Works on Redis 2.6+ (no Redis 7 feature flags needed).
const RATE_LIMIT_SCRIPT = `
  local c = redis.call('INCR', KEYS[1])
  if c == 1 then redis.call('EXPIRE', KEYS[1], 1) end
  return c
`

export async function allow(
  userId: string,
  type: "move" | "chat" | "global" | "auth" | "search"
): Promise<boolean> {
  const key = `rt:rate:${type}:${userId}`
  const count = await redis.eval(RATE_LIMIT_SCRIPT, { keys: [key], arguments: [] }) as number
  return count <= LIMITS[type]
}
