// Render-in-the-past entity interpolation, ported from v1's remote-player
// lerp tween (v1/apps/web/src/phaser/main/remotePlayers.ts) but time-based:
// buffer server snapshots, render each entity ~100ms behind now, lerping
// between the two snapshots that surround the render time. Pure TS, no Pixi.

export const INTERP_DELAY_MS = 100

export interface Snapshot {
  t: number // ms timestamp (client clock at receive time)
  x: number
  y: number
}

export class SnapshotBuffer {
  private buf: Snapshot[] = []

  constructor(
    private delayMs = INTERP_DELAY_MS,
    private maxAgeMs = 1000,
  ) {}

  push(snap: Snapshot) {
    this.buf.push(snap)
    // drop snapshots too old to ever be sampled again
    const cutoff = snap.t - this.maxAgeMs
    while (this.buf.length > 2 && this.buf[0]!.t < cutoff) this.buf.shift()
  }

  /** Position at (now - delayMs). Null if no snapshots yet. */
  sample(now: number): { x: number; y: number } | null {
    const buf = this.buf
    if (buf.length === 0) return null

    const t = now - this.delayMs
    const first = buf[0]!
    const last = buf[buf.length - 1]!
    if (t <= first.t) return { x: first.x, y: first.y }
    if (t >= last.t) return { x: last.x, y: last.y }

    // ponytail: linear scan; buffer stays ~a few entries at 20Hz/1s max age
    for (let i = 1; i < buf.length; i++) {
      const b = buf[i]!
      if (t <= b.t) {
        const a = buf[i - 1]!
        const span = b.t - a.t
        const k = span > 0 ? (t - a.t) / span : 1
        return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }
      }
    }
    return { x: last.x, y: last.y }
  }
}

/** Assert-based self-check: `bun run interpolate.ts` */
export function demo() {
  const buf = new SnapshotBuffer(100)
  buf.push({ t: 0, x: 0, y: 0 })
  buf.push({ t: 100, x: 10, y: 20 })

  // render time 50 = midpoint between the two snapshots
  const mid = buf.sample(150)!
  console.assert(mid.x === 5 && mid.y === 10, `lerp midpoint wrong: ${JSON.stringify(mid)}`)

  // before first snapshot -> clamp to first; past last -> clamp to last
  const early = buf.sample(0)!
  console.assert(early.x === 0 && early.y === 0, "early clamp wrong")
  const late = buf.sample(1000)!
  console.assert(late.x === 10 && late.y === 20, "late clamp wrong")

  console.log("interpolate demo ok")
}

if (import.meta.main) demo()
