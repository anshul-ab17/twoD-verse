import { createClient } from "redis"

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined")
}

//  Redis client for caching, rate limiting

export const redis = createClient({ url: redisUrl })

// Dedicated Pub/Sub clients
export const pub = createClient({ url: redisUrl })
export const sub = createClient({ url: redisUrl })

redis.on("error", (err) => {
  console.error("Redis Error:", err)
})

pub.on("error", (err) => {
  console.error("Redis Pub Error:", err)
})

sub.on("error", (err) => {
  console.error("Redis Sub Error:", err)
})

export async function connectRedis() {
  if (!redis.isOpen) await redis.connect()
  if (!pub.isOpen) await pub.connect()
  if (!sub.isOpen) await sub.connect()
}