type Channel = "global" | "move" | "chat"

interface Bucket {
  count: number
  lastReset: number
}

const buckets = new Map<string, Map<Channel, Bucket>>()

const CONFIG: Record<Channel, { limit: number; window: number }> = {
  global: { limit: 40, window: 1000 },
  move: { limit: 20, window: 1000 },
  chat: { limit: 3, window: 1000 },
}

export function allowMessage(userId: string, channel: Channel): boolean {
  const now = Date.now()

  if (!buckets.has(userId)) {
    buckets.set(userId, new Map())
  }

  const userBuckets = buckets.get(userId)!
  const config = CONFIG[channel]

  if (!userBuckets.has(channel)) {
    userBuckets.set(channel, { count: 1, lastReset: now })
    return true
  }

  const bucket = userBuckets.get(channel)!

  if (now - bucket.lastReset > config.window) {
    bucket.count = 1
    bucket.lastReset = now
    return true
  }

  if (bucket.count >= config.limit) return false

  bucket.count++
  return true
}