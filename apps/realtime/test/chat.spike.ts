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

// 2. rate limit: rapid double-send — second dropped silently
await sleep(500)
roomA.send(MSG.CHAT, { text: "first" })
roomA.send(MSG.CHAT, { text: "second-too-fast" })
await sleep(300)
assert.equal(received.length, 2, `rate limit failed: got ${received.length} messages`)
assert.equal(received[1]!.text, "first")

// 3. 501-char text trimmed to 500
await sleep(500)
roomA.send(MSG.CHAT, { text: "x".repeat(501) })
await sleep(300)
assert.equal(received.length, 3, "long message not delivered")
assert.equal(received[2]!.text.length, CHAT_MAX_LEN, `expected ${CHAT_MAX_LEN} chars, got ${received[2]!.text.length}`)

// 4. empty / whitespace-only rejected
await sleep(500)
roomA.send(MSG.CHAT, { text: "   " })
roomA.send(MSG.CHAT, {} as never)
await sleep(300)
assert.equal(received.length, 3, "empty message was broadcast")

console.log("chat spike ok: round-trip, rate limit, 500-char cap, empty rejection")

await roomA.leave()
await roomB.leave()
process.exit(0)
