// AI notes service spike. Requires ai service + gateway running:
//   bun run src/index.ts                     (this app, :2570)
//   apps/gateway on :2569 (or GATEWAY_URL)
// then:  bun run test/notes.spike.ts
// Without ANTHROPIC_API_KEY in the service env, asserts the 503 path;
// with it, asserts a real structured summary.
import assert from "node:assert"

const AI = process.env.AI_URL ?? "http://localhost:2570"
const GATEWAY = process.env.GATEWAY_URL ?? "http://localhost:2569"

const post = (body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${AI}/v1/ai/notes`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })

const transcript = {
  zoneId: "meeting-room",
  messages: [
    { from: "alice", text: "let's ship the friends panel this week", ts: Date.now() - 60000 },
    { from: "bob", text: "agreed. I'll take the presence bug, due friday", ts: Date.now() - 30000 },
    { from: "alice", text: "decision: we keep polling for now, push later", ts: Date.now() },
  ],
}

// 1. auth required
assert.equal((await post(transcript)).status, 401, "missing bearer not rejected")
assert.equal((await post(transcript, { authorization: "Bearer junk" })).status, 401, "bad bearer not rejected")

// 2. real token from gateway
const email = `ai-spike-${Date.now()}@test.local`
const signup = await fetch(`${GATEWAY}/v1/auth/signup`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "Spike-passw0rd!" }),
})
assert.ok(signup.ok, `gateway signup failed: ${signup.status}`)
const { accessToken } = (await signup.json()) as { accessToken: string }
const bearer = { authorization: `Bearer ${accessToken}` }

// 3. bad body -> 400
assert.equal((await post({ zoneId: "x" }, bearer)).status, 400, "empty transcript not rejected")

// 4. valid request: 503 without key, 200 + structured notes with key
const res = await post(transcript, bearer)
if (res.status === 503) {
  console.log("notes spike ok (503 path — ANTHROPIC_API_KEY not configured)")
} else {
  assert.equal(res.status, 200, `expected 200/503, got ${res.status}: ${await res.text()}`)
  const notes = (await res.json()) as { summary: string; actionItems: string[]; decisions: string[] }
  assert.ok(notes.summary.length > 0, "empty summary")
  assert.ok(Array.isArray(notes.actionItems) && Array.isArray(notes.decisions), "missing arrays")
  console.log(`notes spike ok (live): summary="${notes.summary.slice(0, 80)}…", ${notes.actionItems.length} action items`)
}
