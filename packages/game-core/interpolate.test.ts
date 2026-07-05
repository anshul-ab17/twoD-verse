import { describe, expect, it } from "vitest"
import { SnapshotBuffer } from "./interpolate.ts"

describe("SnapshotBuffer", () => {
  it("lerps at the midpoint between two snapshots", () => {
    const buf = new SnapshotBuffer(100)
    buf.push({ t: 0, x: 0, y: 0 })
    buf.push({ t: 100, x: 10, y: 20 })
    expect(buf.sample(150)).toEqual({ x: 5, y: 10 })
  })

  it("clamps to the first snapshot before the buffer starts", () => {
    const buf = new SnapshotBuffer(100)
    buf.push({ t: 500, x: 3, y: 4 })
    buf.push({ t: 600, x: 30, y: 40 })
    expect(buf.sample(0)).toEqual({ x: 3, y: 4 })
  })

  it("clamps to the last snapshot after the buffer ends", () => {
    const buf = new SnapshotBuffer(100)
    buf.push({ t: 0, x: 0, y: 0 })
    buf.push({ t: 100, x: 10, y: 20 })
    expect(buf.sample(10_000)).toEqual({ x: 10, y: 20 })
  })

  it("returns null when empty and trims snapshots older than maxAgeMs", () => {
    const buf = new SnapshotBuffer(100, 1000)
    expect(buf.sample(0)).toBeNull()

    buf.push({ t: 0, x: 0, y: 0 })
    buf.push({ t: 50, x: 1, y: 1 })
    buf.push({ t: 2000, x: 5, y: 5 }) // cutoff 1000: drops t=0 and t=50
    buf.push({ t: 2100, x: 6, y: 6 })

    // sampling at render time 100 (now=200) would hit t=0 if it survived;
    // instead it clamps to the new first snapshot (t=2000).
    expect(buf.sample(200)).toEqual({ x: 5, y: 5 })
  })
})
