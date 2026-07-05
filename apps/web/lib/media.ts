// Zone + proximity voice/video via LiveKit (plan §6 + media-calls plan).
// Inside a zone the LiveKit room = zoneId; on the open floor everyone shares
// PROXIMITY_ROOM and volume falls off with avatar distance (Approach A —
// client-side attenuation; move to server-assigned rooms past ~15 talkers).
// livekit-client is dynamically imported on first connect so it stays out of
// the initial bundle. Mic and camera default OFF, toggled only by user gesture.

import { bridge } from "./bridge"
import { getAccessToken } from "./auth"
import { SPIKE_ZONES, PROXIMITY_ROOM, canPublishIn } from "@repo/game-core/zones"
import type { Room } from "livekit-client"

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL ?? "http://localhost:2568"

// Desired device state — survives the room teardown/rebuild on zone hops.
const desired = { mic: false, cam: false }
let activeRoom: Room | null = null
let activeCanPublish = false
let inProximityRoom = false
// remote audio elements per participant identity, for proximity volume falloff
const audioEls = new Map<string, HTMLAudioElement[]>()
let lastGains: ReadonlyMap<string, number> = new Map()

async function applyDesired(r: Room) {
  if (!activeCanPublish) return
  try {
    if (desired.mic) await r.localParticipant.setMicrophoneEnabled(true)
    if (desired.cam) await r.localParticipant.setCameraEnabled(true)
  } catch (err) {
    console.error("media re-enable failed", err)
  }
}

/** HUD mic toggle (user gesture). Emits media:mic-changed with the real state. */
export async function setMic(on: boolean): Promise<void> {
  desired.mic = on
  try {
    if (activeRoom) {
      await activeRoom.startAudio().catch(() => {}) // unlock autoplay while we have a gesture
      if (activeCanPublish || !on) await activeRoom.localParticipant.setMicrophoneEnabled(on)
    }
  } catch (err) {
    console.error("mic toggle failed", err) // e.g. permission denied
    desired.mic = false
    bridge.emit("media:mic-changed", { on: false })
    return
  }
  bridge.emit("media:mic-changed", { on })
}

/** HUD camera toggle (user gesture). Emits media:cam-changed with the real state. */
export async function setCam(on: boolean): Promise<void> {
  desired.cam = on
  try {
    if (activeRoom && (activeCanPublish || !on)) {
      await activeRoom.localParticipant.setCameraEnabled(on)
    }
  } catch (err) {
    console.error("camera toggle failed", err)
    desired.cam = false
    bridge.emit("media:cam-changed", { on: false })
    return
  }
  bridge.emit("media:cam-changed", { on })
}

/**
 * Distance-based volume, fed by the world.ts ticker (throttled there, not per
 * frame). Map: participant identity (= userId) -> gain 0..1. Only applied on
 * the open floor — inside a zone everyone is full volume.
 */
export function applyProximityGains(gains: ReadonlyMap<string, number>): void {
  lastGains = gains
  if (!inProximityRoom) return
  for (const [identity, els] of audioEls) {
    const gain = gains.get(identity) ?? 0
    for (const el of els) el.volume = gain
  }
}

/** Watch zone changes on the bridge; join/leave the matching LiveKit room. Returns cleanup. */
export function startMediaWatcher(): () => void {
  let gen = 0 // guards out-of-order async connects on rapid zone hops

  const leave = () => {
    if (!activeRoom) return
    void activeRoom.disconnect()
    activeRoom = null
    audioEls.clear()
    bridge.emit("media:disconnected", undefined)
  }

  const join = (roomName: string, canPublish: boolean, proximity: boolean) => {
    const my = ++gen
    leave()
    void (async () => {
      try {
        const jwt = getAccessToken()
        if (!jwt) return
        const res = await fetch(`${MEDIA_URL}/token`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${jwt}` },
          body: JSON.stringify({ zoneId: roomName, canPublish }),
        })
        if (!res.ok) throw new Error(`media /token ${res.status}`)
        const { token, url } = (await res.json()) as { token: string; url: string }

        const { Room, RoomEvent, Track, VideoPresets } = await import("livekit-client")
        const r = new Room({
          // cheap first cut; simulcast is on by default
          videoCaptureDefaults: { resolution: VideoPresets.h360.resolution },
        })
        r.on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach() as HTMLAudioElement
            // on the open floor start silent until the first gain update —
            // never blast a far-away peer at full volume
            if (proximity) el.volume = lastGains.get(participant.identity) ?? 0
            const els = audioEls.get(participant.identity) ?? []
            els.push(el)
            audioEls.set(participant.identity, els)
          } else if (track.kind === Track.Kind.Video) {
            bridge.emit("media:video-added", {
              identity: participant.identity,
              el: track.attach() as HTMLVideoElement,
            })
          }
        })
        r.on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
          track.detach().forEach((el) => el.remove())
          if (track.kind === Track.Kind.Audio) audioEls.delete(participant.identity)
          else bridge.emit("media:video-removed", { identity: participant.identity })
        })
        r.on(RoomEvent.ParticipantDisconnected, (participant) => {
          audioEls.delete(participant.identity)
          bridge.emit("media:video-removed", { identity: participant.identity })
        })
        // local camera preview tile ("you")
        r.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.track?.kind === Track.Kind.Video) {
            bridge.emit("media:video-added", {
              identity: "you",
              el: pub.track.attach() as HTMLVideoElement,
            })
          }
        })
        r.on(RoomEvent.LocalTrackUnpublished, (pub) => {
          if (pub.track?.kind === Track.Kind.Video) {
            pub.track.detach().forEach((el) => el.remove())
            bridge.emit("media:video-removed", { identity: "you" })
          }
        })

        await r.connect(url, token)
        if (my !== gen) {
          void r.disconnect() // zone changed while connecting
          return
        }
        activeRoom = r
        activeCanPublish = canPublish
        inProximityRoom = proximity
        bridge.emit("media:connected", { zoneId: roomName })
        await applyDesired(r) // mute/cam state survives zone hops
      } catch (err) {
        console.error("media connect failed", err)
      }
    })()
  }

  const off = bridge.on("player:zone-changed", ({ zoneId }) => {
    if (zoneId) {
      const zone = SPIKE_ZONES.find((z) => z.id === zoneId) ?? null
      join(zoneId, canPublishIn(zone), false)
    } else {
      // open floor: shared proximity room, volume by distance
      join(PROXIMITY_ROOM, true, true)
    }
  })

  return () => {
    gen++
    off()
    leave()
  }
}
