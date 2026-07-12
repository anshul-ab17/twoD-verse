import { createClient } from "redis"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

function makeClient() {
  return createClient({
    url: redisUrl,
    socket: {
      // try once, fail fast — no infinite retry loop blocking server startup
      reconnectStrategy: false,
    },
  })
}

export const redis = makeClient()
export const pub = makeClient()
export const sub = makeClient()

redis.on("error", () => {})
pub.on("error", () => {})
sub.on("error", () => {})

export async function connectRedis() {
  await redis.connect()
  await pub.connect()
  await sub.connect()
}
