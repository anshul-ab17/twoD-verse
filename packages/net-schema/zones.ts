// Zone -> media mapping (master plan §6): entering a zone maps to joining
// the LiveKit room named zoneId. Pure data + lookup, no Colyseus schema.

export interface Zone {
  id: string
  kind: "voice" | "stage" | "quiet"
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

/** One voice zone inside WORLD (1600x1200) for the LiveKit spike. */
export const SPIKE_ZONES: readonly Zone[] = [
  { id: "voice-lounge", kind: "voice", bounds: { x: 200, y: 200, w: 400, h: 300 } },
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
