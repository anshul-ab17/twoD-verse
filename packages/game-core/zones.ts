// Zone -> media mapping (master plan §6): entering a zone maps to joining
// the LiveKit room named zoneId. Pure data + lookup, no Colyseus schema.

export interface Zone {
  id: string
  kind: "voice" | "stage" | "quiet" | "meeting"
  bounds: { x: number; y: number; w: number; h: number }
}

/** First zone containing (x, y), or null. ponytail: linear scan, fine for a handful of zones. */
export function zoneAt(zones: readonly Zone[], x: number, y: number): Zone | null {
  for (const z of zones) {
    const b = z.bounds
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return z
  }
  return null
}

/** Publish policy: talk allowed everywhere except quiet zones; null = open floor (proximity). */
export function canPublishIn(zone: Zone | null): boolean {
  return zone?.kind !== "quiet"
}

// Proximity voice (media-calls plan §3, Approach A): outside zones everyone
// shares one LiveKit room; the client attenuates volume by avatar distance.
export const PROXIMITY_ROOM = "floor-1"
export const PROXIMITY_RADIUS = 260 // world px; beyond this a peer is silent

/** Linear volume falloff 1 → 0 over PROXIMITY_RADIUS. ponytail: linear, swap in smoothstep if it sounds abrupt. */
export function proximityGain(dist: number): number {
  return dist >= PROXIMITY_RADIUS ? 0 : 1 - dist / PROXIMITY_RADIUS
}

/** Spike zones inside WORLD (1600x1200): voice lounge + meeting room (voice + AI notes). */
export const SPIKE_ZONES: readonly Zone[] = [
  { id: "voice-lounge", kind: "voice", bounds: { x: 200, y: 200, w: 400, h: 300 } },
  { id: "meeting-room", kind: "meeting", bounds: { x: 1000, y: 700, w: 400, h: 300 } },
]

/** Assert-based self-check: `bun run zones.ts` */
function demo() {
  const inside = zoneAt(SPIKE_ZONES, 300, 300)
  console.assert(inside?.id === "voice-lounge", `inside lookup wrong: ${JSON.stringify(inside)}`)

  const outside = zoneAt(SPIKE_ZONES, 1000, 1000)
  console.assert(outside === null, `outside lookup wrong: ${JSON.stringify(outside)}`)

  // edge: bounds are half-open [x, x+w)
  console.assert(zoneAt(SPIKE_ZONES, 200, 200)?.id === "voice-lounge", "left edge wrong")
  console.assert(zoneAt(SPIKE_ZONES, 600, 500) === null, "right edge should be exclusive")

  console.log("zones demo ok")
}

if (import.meta.main) demo()
