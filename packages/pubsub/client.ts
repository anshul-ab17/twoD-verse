import { createClient } from "redis"

export const pub = createClient({ url: process.env.REDIS_URL })
export const sub = createClient({ url: process.env.REDIS_URL })

export async function connectRedis() {
  if (!pub.isOpen) await pub.connect()
  if (!sub.isOpen) await sub.connect()
}
