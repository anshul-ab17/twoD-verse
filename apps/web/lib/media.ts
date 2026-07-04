// Zone voice via LiveKit (plan §6: enter zone -> LiveKit room = zoneId).
// livekit-client is dynamically imported on first zone entry so it stays out
// of the initial bundle. Subscribe-only: nothing is published.

import { bridge } from "./bridge"
import { getAccessToken } from "./auth"
import type { Room } from "livekit-client"

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:2568"

/** Watch zone changes on the bridge; join/leave the matching LiveKit room. Returns cleanup. */
export function startMediaWatcher(): () => void {
  let room: Room | null = null
  let gen = 0 // guards out-of-order async connects on rapid zone hops

  const leave = () => {
    if (!room) return
    void room.disconnect()
    room = null
    bridge.emit("media:disconnected", undefined)
  }

  const off = bridge.on("player:zone-changed", ({ zoneId }) => {
    const my = ++gen
    leave()
    if (!zoneId) return
    void (async () => {
      try {
        const jwt = getAccessToken()
        if (!jwt) return
        const res = await fetch(`${MEDIA_URL}/token`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ zoneId, canPublish: false }),
        })
        if (!res.ok) throw new Error(`media /token ${res.status}`)
        const { token, url } = (await res.json()) as { token: string; url: string }

        const { Room, RoomEvent, Track } = await import("livekit-client")
        const r = new Room()
        r.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) track.attach() // auto-play remote audio
        })
        await r.connect(url, token)
        if (my !== gen) {
          void r.disconnect() // zone changed while connecting
          return
        }
        // ponytail: mic stays OFF — token is subscribe-only (canPublish:false).
        // Publish path: mint a canPublish token + localParticipant.setMicrophoneEnabled(true)
        // behind an explicit user gesture (permission prompts break headless verify).
        room = r
        bridge.emit("media:connected", { zoneId })
      } catch (err) {
        console.error("media connect failed", err)
      }
    })()
  })

  return () => {
    gen++
    off()
    leave()
  }
}
