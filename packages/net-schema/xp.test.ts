import { describe, expect, it } from "vitest"
import { levelForXp, xpForLevel, XP_AWARDS } from "./xp.ts"

describe("levelForXp", () => {
  it("is level 1 at 0 xp", () => {
    expect(levelForXp(0)).toBe(1)
  })

  it("is monotonic non-decreasing", () => {
    let prev = levelForXp(0)
    for (let xp = 0; xp <= 10_000; xp += 37) {
      const lvl = levelForXp(xp)
      expect(lvl).toBeGreaterThanOrEqual(prev)
      prev = lvl
    }
  })

  it("clamps negative xp to level 1", () => {
    expect(levelForXp(-50)).toBe(1)
  })
})

describe("xpForLevel inverse round-trip", () => {
  it("levelForXp(xpForLevel(n)) === n", () => {
    for (let level = 1; level <= 50; level++) {
      expect(levelForXp(xpForLevel(level))).toBe(level)
    }
  })

  it("one xp below the threshold is the previous level", () => {
    for (let level = 2; level <= 50; level++) {
      expect(levelForXp(xpForLevel(level) - 1)).toBe(level - 1)
    }
  })
})

describe("XP_AWARDS", () => {
  it("all awards are positive integers", () => {
    for (const v of Object.values(XP_AWARDS)) {
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThan(0)
    }
  })
})
