// Two-client authoritative-movement harness (no test framework).
//
// Requires the server running first:
//   pnpm --filter @verse/realtime dev     (or: bun run src/index.ts)
// then:
//   pnpm --filter @verse/realtime test:spike
//
// Client A sends "move" inputs for ~2s; asserts client B observes A's
// position changing, staying in bounds, and never exceeding MOVE_SPEED.

import assert from "node:assert"
import { Client } from "colyseus.js"
import { MSG, MOVE_SPEED, WORLD } from "@verse/net-schema"

const url = process.env.REALTIME_URL ?? "ws://localhost:2567"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const roomA = await new Client(url).joinOrCreate("world")
const roomB = await new Client(url).joinOrCreate("world")
assert.equal(roomA.roomId, roomB.roomId, "clients joined different rooms")

// let initial state sync
await sleep(300)

const readAFromB = () => {
  const p = (roomB.state as any).players.get(roomA.sessionId)
  assert.ok(p, "client B does not see client A in state")
  return { x: p.x as number, y: p.y as number }
}

const start = readAFromB()
const samples: { t: number; x: number; y: number }[] = []

// A moves right+down for ~2s; B samples what it observes
roomA.send(MSG.MOVE, { dx: 1, dy: 1 })
const t0 = Date.now()
while (Date.now() - t0 < 2000) {
  await sleep(50)
  samples.push({ t: Date.now(), ...readAFromB() })
}
roomA.send(MSG.MOVE, { dx: 0, dy: 0 })

const end = samples[samples.length - 1]!

// 1. B observed A moving
assert.ok(
  Math.hypot(end.x - start.x, end.y - start.y) > 50,
  `A barely moved as seen by B: ${JSON.stringify({ start, end })}`,
)

// 2. always within world bounds
for (const s of samples) {
  assert.ok(s.x >= 0 && s.x <= WORLD.width && s.y >= 0 && s.y <= WORLD.height,
    `out of bounds: ${JSON.stringify(s)}`)
}

// 3. speed clamp: average speed over the run never exceeds MOVE_SPEED (+10%).
// Pairwise instantaneous speed is meaningless here — sample times are packet
// *arrival* times, and two patches landing close together inflate it.
const first = samples[0]!
const runDt = (end.t - first.t) / 1000
const avgSpeed = Math.hypot(end.x - first.x, end.y - first.y) / runDt
assert.ok(avgSpeed <= MOVE_SPEED * 1.1, `speed clamp violated: avg ${avgSpeed.toFixed(1)} px/s`)

console.log(
  `spike ok: A moved ${Math.hypot(end.x - start.x, end.y - start.y).toFixed(0)}px as observed by B, ` +
    `${samples.length} samples, all in bounds and under speed clamp`,
)

await roomA.leave()
await roomB.leave()
process.exit(0)
