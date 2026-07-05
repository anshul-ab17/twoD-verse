import { describe, expect, it } from "vitest"
import {
  PROXIMITY_RADIUS,
  SPIKE_ZONES,
  canPublishIn,
  proximityGain,
  zoneAt,
} from "./zones.ts"

const WORLD = { w: 1600, h: 1200 }

describe("zoneAt", () => {
  it("finds a zone for a point inside", () => {
    expect(zoneAt(SPIKE_ZONES, 300, 300)?.id).toBe("voice-lounge")
  })

  it("returns null outside every zone", () => {
    expect(zoneAt(SPIKE_ZONES, 1000, 1000)).toBeNull()
  })

  it("uses half-open bounds: min edge inside, max edge outside", () => {
    // voice-lounge: x 200..600, y 200..500
    expect(zoneAt(SPIKE_ZONES, 200, 200)?.id).toBe("voice-lounge")
    expect(zoneAt(SPIKE_ZONES, 600, 300)).toBeNull()
    expect(zoneAt(SPIKE_ZONES, 300, 500)).toBeNull()
  })
})

describe("proximityGain", () => {
  it("is full volume at zero distance, silent at/beyond radius", () => {
    expect(proximityGain(0)).toBe(1)
    expect(proximityGain(PROXIMITY_RADIUS)).toBe(0)
    expect(proximityGain(PROXIMITY_RADIUS * 2)).toBe(0)
  })

  it("falls off linearly in between", () => {
    expect(proximityGain(PROXIMITY_RADIUS / 2)).toBeCloseTo(0.5)
  })
})

describe("canPublishIn", () => {
  it("allows talk in voice/meeting zones and on the open floor", () => {
    expect(canPublishIn(SPIKE_ZONES[0] ?? null)).toBe(true) // voice-lounge
    expect(canPublishIn(SPIKE_ZONES[1] ?? null)).toBe(true) // meeting-room
    expect(canPublishIn(null)).toBe(true) // proximity floor
  })

  it("blocks publishing in quiet zones", () => {
    expect(canPublishIn({ id: "library", kind: "quiet", bounds: { x: 0, y: 0, w: 1, h: 1 } })).toBe(false)
  })
})

describe("SPIKE_ZONES", () => {
  it("fits inside the world bounds", () => {
    for (const z of SPIKE_ZONES) {
      const b = z.bounds
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(WORLD.w)
      expect(b.y + b.h).toBeLessThanOrEqual(WORLD.h)
    }
  })
})
