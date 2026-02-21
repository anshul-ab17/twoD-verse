import { client } from "@repo/db"
import { redis, publish } from "@repo/pubsub"

const CACHE_TTL = 60

function getUserSpacesCacheKey(userId: string) {
  return `spaces:user:${userId}`
}

export async function getSpaces(userId: string) {
  const cacheKey = getUserSpacesCacheKey(userId)

  const cached = await redis.get(cacheKey)

  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      await redis.del(cacheKey)
    }
  }

  const spaces = await client.space.findMany({
    where: {
      creatorId: userId,
    },
    include: {
      creator: {
        select: { id: true, email: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  await redis.set(cacheKey, JSON.stringify(spaces), {
    EX: CACHE_TTL,
  })

  return spaces
}

export async function createSpace(
  userId: string,
  data: { name: string; width: number; height: number }
) {
  const space = await client.space.create({
    data: {
      name: data.name,
      width: data.width,
      height: data.height,
      creatorId: userId,
    },
  })

  // Invalidate only this user's cache
  await redis.del(getUserSpacesCacheKey(userId))

  // Publish event for WS instances
  await publish("spaces", {
    type: "SPACE_CREATED",
    payload: {
      id: space.id,
      name: space.name,
      creatorId: userId,
    },
  })

  return space
}