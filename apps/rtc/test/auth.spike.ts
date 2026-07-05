// HTTP auth harness for /token (no test framework). Requires:
//   gateway on :2569, and a media server:  MEDIA_PORT=2572 bun run src/index.ts
// then:  MEDIA_URL=http://localhost:2572 bun run test/auth.spike.ts
import assert from "node:assert"

const MEDIA = process.env.MEDIA_URL ?? "http://localhost:2568"
const GATEWAY = process.env.GATEWAY_URL ?? "http://localhost:2569"

const post = (headers: Record<string, string>) =>
  fetch(`${MEDIA}/token`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ zoneId: "voice-lounge" }),
  })

// 1. no Authorization -> 401
assert.equal((await post({})).status, 401, "missing bearer not rejected")

// 2. garbage bearer -> 401
assert.equal((await post({ authorization: "Bearer not-a-jwt" })).status, 401, "bad bearer not rejected")

// 3. real access token from gateway signup -> 200 with LiveKit token
const email = `media-spike-${Date.now()}@test.local`
const signup = await fetch(`${GATEWAY}/v1/auth/signup`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "Spike-passw0rd!" }),
})
assert.ok(signup.ok, `gateway signup failed: ${signup.status}`)
const { accessToken } = (await signup.json()) as { accessToken: string }

const ok = await post({ authorization: `Bearer ${accessToken}` })
const okText = await ok.text()
assert.equal(ok.status, 200, `expected 200, got ${ok.status}: ${okText}`)
const body = JSON.parse(okText) as { token: string; url: string }
assert.ok(body.token.split(".").length === 3, "response missing LiveKit JWT")

console.log("media auth spike ok: 401 without/with-bad bearer, 200 with gateway access token")
