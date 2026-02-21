import { client } from "@repo/db"

export async function getSpaces() {
  return client.space.findMany({
    include: {
      creator: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  })
}

export async function createSpace(userId: string, data: any) {
  if (!data.name || !data.width || !data.height) {
    throw new Error("Invalid space data")
  }

  return client.space.create({
    data: {
      name: data.name,
      width: data.width,
      height: data.height,
      creatorId: userId,
    },
  })
}