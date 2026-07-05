import { describe, expect, it } from "vitest"
import { SPIKE_ZONES, zoneAt } from "./zones.ts"

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
