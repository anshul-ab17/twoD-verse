import { client } from "@repo/db"
import { redis, publish } from "@repo/pubsub"

const SPACES_CACHE_KEY = "spaces:all"
const CACHE_TTL = 60

export async function getSpaces() {
  const cached = await redis.get(SPACES_CACHE_KEY)

  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
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

  await redis.set(SPACES_CACHE_KEY, JSON.stringify(spaces), {
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

  await redis.del(SPACES_CACHE_KEY)

  await publish("spaces", {
    type: "SPACE_CREATED",
    payload: space,
  })

  return space
}