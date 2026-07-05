// Friends + presence spike (no test framework). Servers must be running:
//   GATEWAY_PORT=2573 bun run src/index.ts            (this app)
//   PORT=2574 bun run src/index.ts                    (apps/game-engine)
// then:
//   GATEWAY_PORT=2573 REALTIME_URL=ws://localhost:2574 pnpm --filter @repo/gateway test:friends

import assert from "node:assert"
import { Client } from "colyseus.js"

const base = `http://localhost:${process.env.GATEWAY_PORT ?? 2569}`
const realtimeUrl = process.env.REALTIME_URL ?? "ws://localhost:2567"
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type FriendsData = {
  friends: { userId: string; handle: string | null; online: boolean }[]
  pending: { incoming: { id: string; handle: string | null }[]; outgoing: { id: string; handle: string | null }[] }
}

async function signup(handle: string) {
  const res = await fetch(`${base}/v1/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `${handle}@example.com`, password: "Sp1ke!pass", handle }),
  })
  assert.equal(res.status, 201, `signup ${handle}: ${res.status}`)
  return ((await res.json()) as { accessToken: string }).accessToken
}

const api = (token: string) => ({
  post: (path: string, body: unknown) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }),
  friends: async (): Promise<FriendsData> => {
    const res = await fetch(`${base}/v1/friends`, { headers: { authorization: `Bearer ${token}` } })
    assert.equal(res.status, 200, `GET /v1/friends: ${res.status}`)
    return (await res.json()) as FriendsData
  },
})

const suffix = crypto.randomUUID().slice(0, 8)
const handleA = `spike-a-${suffix}`
const handleB = `spike-b-${suffix}`
const [tokenA, tokenB] = await Promise.all([signup(handleA), signup(handleB)])
const A = api(tokenA)
const B = api(tokenB)

// unauthenticated → 401
assert.equal((await fetch(`${base}/v1/friends`)).status, 401, "no-token GET should 401")

// self-request → 400
assert.equal((await A.post("/v1/friends/request", { handle: handleA })).status, 400, "self-request should 400")

// unknown handle → 404
assert.equal((await A.post("/v1/friends/request", { handle: `nobody-${suffix}` })).status, 404, "unknown handle should 404")

// A requests B → 201
assert.equal((await A.post("/v1/friends/request", { handle: handleB })).status, 201, "request should 201")

// duplicate (same + reverse direction) → 409
assert.equal((await A.post("/v1/friends/request", { handle: handleB })).status, 409, "duplicate should 409")
assert.equal((await B.post("/v1/friends/request", { handle: handleA })).status, 409, "reverse duplicate should 409")

// B sees incoming, A sees outgoing
const bBefore = await B.friends()
assert.equal(bBefore.pending.incoming.length, 1, "B should have 1 incoming")
assert.equal(bBefore.pending.incoming[0]!.handle, handleA)
const aBefore = await A.friends()
assert.equal(aBefore.pending.outgoing[0]!.handle, handleB, "A should see outgoing to B")

// B accepts
const accept = await B.post("/v1/friends/respond", { requestId: bBefore.pending.incoming[0]!.id, accept: true })
assert.equal(accept.status, 200, `respond: ${accept.status}`)

// both sides now friends, B offline (not in realtime yet)
const aAfter = await A.friends()
assert.equal(aAfter.friends.length, 1)
assert.equal(aAfter.friends[0]!.handle, handleB)
assert.equal(aAfter.friends[0]!.online, false, "B should be offline before joining realtime")
const bAfter = await B.friends()
assert.equal(bAfter.friends[0]!.handle, handleA)
assert.equal(bAfter.pending.incoming.length, 0, "request should be consumed")

// re-request after friendship → 409
assert.equal((await A.post("/v1/friends/request", { handle: handleB })).status, 409, "request-when-friends should 409")

// presence: B joins realtime → A sees online:true; B leaves → online:false
const room = await new Client(realtimeUrl).joinOrCreate("world", { token: tokenB })
await sleep(300)
assert.equal((await A.friends()).friends[0]!.online, true, "B should be online after joining realtime")
await room.leave()
await sleep(300)
assert.equal((await A.friends()).friends[0]!.online, false, "B should be offline after leaving")

console.log("friends spike ok")
