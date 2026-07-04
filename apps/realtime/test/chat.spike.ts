// Chat round-trip harness (no test framework). Server must be running:
//   PORT=2571 bun run src/index.ts
// then:
//   REALTIME_URL=ws://localhost:2571 pnpm --filter @repo/realtime test:chat

import assert from "node:assert"
import { Client } from "colyseus.js"
import { MSG, CHAT_BROADCAST, CHAT_MAX_LEN, type ChatBroadcast } from "@repo/net-schema"
import { freshToken } from "./token.helper"

const url = process.env.REALTIME_URL ?? "ws://localhost:2567"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const [tokenA, tokenB] = await Promise.all([freshToken(), freshToken()])
const roomA = await new Client(url).joinOrCreate("world", { token: tokenA })
const roomB = await new Client(url).joinOrCreate("world", { token: tokenB })
assert.equal(roomA.roomId, roomB.roomId, "clients joined different rooms")

const received: ChatBroadcast[] = []
roomB.onMessage(CHAT_BROADCAST, (msg: ChatBroadcast) => received.push(msg))

// 1. basic round-trip: A sends, B receives with A's sessionId
roomA.send(MSG.CHAT, { text: "hello world" })
await sleep(300)
assert.equal(received.length, 1, `expected 1 message, got ${received.length}`)
assert.equal(received[0]!.from, roomA.sessionId, "from !== A.sessionId")
assert.equal(received[0]!.text, "hello world")
assert.ok(typeof received[0]!.ts === "number" && received[0]!.ts > 0, "missing ts")

// 2. rate limit: Redis window is 3 msg/s per user — burst of 5 delivers ≤ 3
await sleep(1100)
const before = received.length
for (let i = 0; i < 5; i++) roomA.send(MSG.CHAT, { text: `burst-${i}` })
await sleep(400)
const delivered = received.length - before
assert.ok(delivered >= 1 && delivered <= 3, `rate limit failed: burst of 5 delivered ${delivered}`)

// 3. 501-char text trimmed to 500
await sleep(1100)
let count = received.length
roomA.send(MSG.CHAT, { text: "x".repeat(501) })
await sleep(300)
assert.equal(received.length, count + 1, "long message not delivered")
assert.equal(received.at(-1)!.text.length, CHAT_MAX_LEN, `expected ${CHAT_MAX_LEN} chars`)

// 4. empty / whitespace-only rejected
await sleep(1100)
count = received.length
roomA.send(MSG.CHAT, { text: "   " })
roomA.send(MSG.CHAT, {} as never)
await sleep(300)
assert.equal(received.length, count, "empty message was broadcast")

// 5. moderation: blocklisted word masked
await sleep(1100)
roomA.send(MSG.CHAT, { text: "you badword you" })
await sleep(300)
assert.equal(received.at(-1)!.text, "you ******* you", `filter failed: ${received.at(-1)!.text}`)

console.log("chat spike ok: round-trip, redis rate limit, 500-char cap, empty rejection, word filter")

await roomA.leave()
await roomB.leave()
process.exit(0)
