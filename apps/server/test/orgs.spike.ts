// Orgs + invites + RBAC spike. Requires gateway (:2569 or GATEWAY_PORT) + Postgres.
//   bun run test/orgs.spike.ts
import assert from "node:assert"

const base = `http://localhost:${process.env.GATEWAY_PORT ?? 2569}`

async function signup() {
  const res = await fetch(`${base}/v1/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: `org-${crypto.randomUUID()}@test.local`, password: "Spike-passw0rd!" }),
  })
  assert.ok(res.ok, `signup failed: ${res.status}`)
  const { accessToken } = (await res.json()) as { accessToken: string }
  return accessToken
}

const api = (token: string) => (method: string, path: string, body?: unknown) =>
  fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  })

const a = api(await signup())
const b = api(await signup())

// A creates an org -> OWNER
const created = await a("POST", "/v1/orgs", { name: "acme" })
assert.equal(created.status, 201)
const { id: orgId } = (await created.json()) as { id: string }
const myOrgs = (await (await a("GET", "/v1/orgs")).json()) as { orgs: { id: string; role: string }[] }
assert.equal(myOrgs.orgs.find((o) => o.id === orgId)?.role, "OWNER", "creator not OWNER")

// B (not a member) cannot mint invites
assert.equal((await b("POST", `/v1/orgs/${orgId}/invites`)).status, 403, "non-member minted invite")

// A invites, B accepts -> MEMBER
const inv = await a("POST", `/v1/orgs/${orgId}/invites`)
assert.equal(inv.status, 201)
const { inviteId } = (await inv.json()) as { inviteId: string }
const accept = await b("POST", `/v1/invites/${inviteId}/accept`)
assert.equal(accept.status, 200, `accept failed: ${accept.status}`)
const bOrgs = (await (await b("GET", "/v1/orgs")).json()) as { orgs: { id: string; role: string }[] }
assert.equal(bOrgs.orgs.find((o) => o.id === orgId)?.role, "MEMBER", "B not MEMBER after accept")

// single-use: same invite again -> 410 (even by another user)
assert.equal((await b("POST", `/v1/invites/${inviteId}/accept`)).status, 410, "invite reusable")

// MEMBER (not admin) still cannot mint invites
assert.equal((await b("POST", `/v1/orgs/${orgId}/invites`)).status, 403, "MEMBER minted invite")

// bogus invite -> 410
assert.equal((await b("POST", `/v1/invites/nope/accept`)).status, 410, "bogus invite accepted")

console.log("orgs spike ok: create/OWNER, RBAC 403s, invite accept, single-use, bogus rejected")
