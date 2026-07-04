// XP award harness (no test framework). Server must be running with DATABASE_URL:
//   PORT=2574 bun run src/index.ts
// then:
//   REALTIME_URL=ws://localhost:2574 pnpm --filter @verse/realtime test:xp
// Gateway on :2569 mints the real access token (token.helper).

import assert from "node:assert"
import { Client } from "colyseus.js"
import { MSG, XP_AWARDS, type WorldRoomState } from "@verse/net-schema"
import { freshToken } from "./token.helper"

const url = process.env.REALTIME_URL ?? "ws://localhost:2567"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const token = await freshToken() // one user for the whole spike — daily is per-user
const join = () => new Client(url).joinOrCreate<WorldRoomState>("world", { token })

// 1. first join today -> DAILY_LOGIN granted
const roomA = await join()
await sleep(500) // onJoin loads DB + awards async; wait for state sync
const me = () => roomA.state.players.get(roomA.sessionId)!
assert.ok(me().xp >= XP_AWARDS.DAILY_LOGIN, `daily not granted: xp=${me().xp}`)
assert.equal(me().level, 1)
const afterDaily = me().xp

// 2. accepted chat message -> CHAT_MESSAGE xp
roomA.send(MSG.CHAT, { text: "xp please" })
await sleep(400)
assert.equal(me().xp, afterDaily + XP_AWARDS.CHAT_MESSAGE, "chat xp not granted")

const total = me().xp
await roomA.leave()
await sleep(300) // let the fire-and-forget DB flush land before rejoining

// 3. second join same day -> no second daily, persisted xp loaded back
const roomB = await join()
await sleep(500)
const me2 = roomB.state.players.get(roomB.sessionId)!
assert.equal(me2.xp, total, `expected persisted xp ${total} with no second daily, got ${me2.xp}`)

console.log(
  `xp spike ok: daily +${XP_AWARDS.DAILY_LOGIN}, chat +${XP_AWARDS.CHAT_MESSAGE}, no double daily (final xp=${me2.xp})`,
)

await roomB.leave()
process.exit(0)
