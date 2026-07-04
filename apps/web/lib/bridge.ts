// Typed event bridge, generalizing v1's `twodverse:*` CustomEvent pattern
// (v1/apps/web/src/phaser/main/eventBridge.ts) without window globals.
//
// THE RULE (plan §12): the Pixi render loop and React never call each other
// directly — only via this bridge, and only on discrete events (never per
// frame), so React never setStates from the 60fps loop.

export type BridgeEvents = {
  "net:connected": { sessionId: string }
  "net:disconnected": void
  "player:zone-changed": { zoneId: string }
  "chat:message": { from: string; text: string; ts: number }
  "media:connected": { zoneId: string }
  "media:disconnected": void
}

type Handler<K extends keyof BridgeEvents> = (payload: BridgeEvents[K]) => void

class Bridge {
  private handlers = new Map<keyof BridgeEvents, Set<Handler<never>>>()

  /** Subscribe; returns an unsubscribe function. */
  on<K extends keyof BridgeEvents>(event: K, handler: Handler<K>): () => void {
    let set = this.handlers.get(event)
    if (!set) this.handlers.set(event, (set = new Set()))
    set.add(handler as Handler<never>)
    return () => set.delete(handler as Handler<never>)
  }

  emit<K extends keyof BridgeEvents>(event: K, payload: BridgeEvents[K]) {
    this.handlers.get(event)?.forEach((h) => (h as Handler<K>)(payload))
  }
}

export const bridge = new Bridge()
