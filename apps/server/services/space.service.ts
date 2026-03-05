import { client } from "@repo/db"
import { redis, publish } from "@repo/pubsub"

const CACHE_TTL = 60

function getUserSpacesCacheKey(userId: string) {
  return `spaces:user:${userId}`
}

async function getCachedSpaces(cacheKey: string) {
  try {
    return await redis.get(cacheKey)
  } catch (error) {
    console.error("Failed to read spaces cache:", error)
    return null
  }
}

async function setCachedSpaces(cacheKey: string, spaces: unknown) {
  try {
    await redis.set(cacheKey, JSON.stringify(spaces), {
      EX: CACHE_TTL,
    })
  } catch (error) {
    console.error("Failed to write spaces cache:", error)
  }
}

async function invalidateUserSpacesCache(userId: string) {
  try {
    await redis.del(getUserSpacesCacheKey(userId))
  } catch (error) {
    console.error("Failed to invalidate spaces cache:", error)
  }
}

export async function getSpaces(userId: string) {
  const cacheKey = getUserSpacesCacheKey(userId)

  const cached = await getCachedSpaces(cacheKey)

  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      try {
        await redis.del(cacheKey)
      } catch (error) {
        console.error("Failed to delete invalid spaces cache:", error)
      }
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

  await setCachedSpaces(cacheKey, spaces)

  return spaces
}

export async function getSpaceById(spaceId: string) {
  return client.space.findUnique({
    where: { id: spaceId },
    include: {
      creator: {
        select: { id: true, email: true },
      },
    },
  })
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
  await invalidateUserSpacesCache(userId)

  // Publish event for WS instances
  try {
    await publish("spaces", {
      type: "SPACE_CREATED",
      payload: {
        id: space.id,
        name: space.name,
        creatorId: userId,
      },
    })
  } catch (error) {
    console.error("Failed to publish SPACE_CREATED event:", error)
  }

  return space
}

export async function deleteSpace(
  userId: string,
  spaceId: string
) {
  const space = await client.space.findUnique({
    where: { id: spaceId },
    select: { id: true, creatorId: true },
  })

  if (!space) {
    return { status: "not_found" as const }
  }

  if (space.creatorId !== userId) {
    return { status: "forbidden" as const }
  }

  await client.space.delete({
    where: { id: spaceId },
  })

  await invalidateUserSpacesCache(userId)

  return { status: "deleted" as const }
}
