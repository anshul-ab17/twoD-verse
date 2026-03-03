import { publish, subscribe } from "@repo/pubsub"
import { spaceManager } from "./managers/space.manager"

const CHANNEL = "rt:ws:broadcast"

export async function publishEvent(spaceId: string, payload: any) {
  await publish(CHANNEL, { spaceId, payload })
}

export async function initRedisSubscriber() {
  await subscribe(CHANNEL, ({ spaceId, payload }) => {
    spaceManager.localBroadcast(spaceId, payload)
  })
}