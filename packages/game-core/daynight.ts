// Day/night cycle (plan §3 M-tier: "day/night cycle, ambient music").
// Phase derives from wall-clock epoch time, so every client and server agree
// without any state sync. ponytail: fixed 10-minute cycle — per-world config later.

export const DAY_CYCLE_MS = 10 * 60_000

/** 0..1: 0 = midnight, 0.5 = noon. */
export function dayPhase(now = Date.now()): number {
  return (now % DAY_CYCLE_MS) / DAY_CYCLE_MS
}

/** Darkness overlay alpha for the renderer: 0 at noon, max at midnight. */
export function darknessAt(phase: number, max = 0.45): number {
  // cosine curve: phase 0 (midnight) -> max, 0.5 (noon) -> 0
  return ((Math.cos(phase * Math.PI * 2) + 1) / 2) * max
}

/** Assert-based self-check: `bun run daynight.ts` */
function demo() {
  console.assert(darknessAt(0.5) < 1e-9, "noon should be fully lit")
  console.assert(Math.abs(darknessAt(0) - 0.45) < 1e-9, "midnight should be darkest")
  console.assert(darknessAt(0.25) > 0 && darknessAt(0.25) < 0.45, "dusk in between")
  const p = dayPhase(DAY_CYCLE_MS * 3 + DAY_CYCLE_MS / 2)
  console.assert(Math.abs(p - 0.5) < 1e-9, `phase wrap wrong: ${p}`)
  console.log("daynight demo ok")
}

if (import.meta.main) demo()
