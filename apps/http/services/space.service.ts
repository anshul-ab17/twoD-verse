import { client } from "@repo/db"
import { redis, publish } from "@repo/pubsub"

const SPACES_CACHE_KEY = "spaces:all"
const CACHE_TTL = 60 // seconds

export async function getSpaces() {
  const cached = await redis.get(SPACES_CACHE_KEY)

  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      // If cache corrupted, delete and continue
      await redis.del(SPACES_CACHE_KEY)
    }
  }

  const spaces = await client.space.findMany({
    include: {
      creator: {
        select: { id: true, email: true },
      },
    },
  })

  await redis.set(
    SPACES_CACHE_KEY,
    JSON.stringify(spaces),
    { EX: CACHE_TTL }
  )

  return spaces
}

export async function createSpace(
  userId: string,
  data: { name: string; width: number; height: number }
) {
  if (!data.name || !data.width || !data.height) {
    throw new Error("Invalid space data")
  }

  const space = await client.space.create({
    data: {
      name: data.name,
      width: data.width,
      height: data.height,
      creatorId: userId,
    },
  })

  // Invalidate cache
  await redis.del(SPACES_CACHE_KEY)

  // Optional: publish event (for realtime)
  await publish("spaces", {
    type: "SPACE_CREATED",
    payload: space,
  })

  return space
}