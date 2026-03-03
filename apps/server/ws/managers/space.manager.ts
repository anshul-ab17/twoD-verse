import { playerManager } from "./player.manager"
import { publishEvent } from "../redis.adapter"

class SpaceManager {
  async broadcast(spaceId: string, payload: any) {
    // Publish to Redis so all instances receive it
    await publishEvent(spaceId, payload)
  }

  localBroadcast(spaceId: string, payload: any) {
    playerManager.getAll().forEach((player) => {
      if (player.spaceId === spaceId && player.ws.readyState === player.ws.OPEN) {
        player.ws.send(JSON.stringify(payload))
      }
    })
  }
}

export const spaceManager = new SpaceManager()