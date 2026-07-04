// Integration spike: assumes gateway on :2569 (or GATEWAY_PORT) + Postgres up.
// Flow: signup → login → refresh → /v1/me → logout → refresh must 401.
// `bun run test/auth.spike.ts`

const base = `http://localhost:${process.env.GATEWAY_PORT ?? 2569}`
const email = `spike-${crypto.randomUUID()}@example.com`
const password = "Sp1ke!pass"

type Tokens = { accessToken: string; refreshToken: string }

async function post(path: string, body: unknown) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return res
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${msg}`)
}

// signup
const signupRes = await post("/v1/auth/signup", { email, password })
assert(signupRes.status === 201, `signup expected 201, got ${signupRes.status}`)
const signup = (await signupRes.json()) as Tokens
assert(signup.accessToken && signup.refreshToken, "signup returns dual tokens")

// login
const loginRes = await post("/v1/auth/login", { email, password })
assert(loginRes.status === 200, `login expected 200, got ${loginRes.status}`)
const login = (await loginRes.json()) as Tokens
assert(login.accessToken && login.refreshToken, "login returns dual tokens")

// wrong password → 401
const badLogin = await post("/v1/auth/login", { email, password: "Wrong!pass1" })
assert(badLogin.status === 401, `bad login expected 401, got ${badLogin.status}`)

// refresh (rotation: new pair, old refresh dead)
const refreshRes = await post("/v1/auth/refresh", { refreshToken: login.refreshToken })
assert(refreshRes.status === 200, `refresh expected 200, got ${refreshRes.status}`)
const rotated = (await refreshRes.json()) as Tokens
assert(rotated.accessToken && rotated.refreshToken, "refresh returns dual tokens")

const reuse = await post("/v1/auth/refresh", { refreshToken: login.refreshToken })
assert(reuse.status === 401, `refresh reuse expected 401, got ${reuse.status}`)

// protected probe
const meRes = await fetch(`${base}/v1/me`, {
  headers: { Authorization: `Bearer ${rotated.accessToken}` },
})
assert(meRes.status === 200, `/v1/me expected 200, got ${meRes.status}`)
const me = (await meRes.json()) as { email: string }
assert(me.email === email, `/v1/me email mismatch: ${me.email}`)

// refresh token must not pass as access token
const meWithRefresh = await fetch(`${base}/v1/me`, {
  headers: { Authorization: `Bearer ${rotated.refreshToken}` },
})
assert(meWithRefresh.status === 401, `/v1/me with refresh token expected 401, got ${meWithRefresh.status}`)

// logout
const logoutRes = await post("/v1/auth/logout", { refreshToken: rotated.refreshToken })
assert(logoutRes.status === 204, `logout expected 204, got ${logoutRes.status}`)

// refresh after logout must 401
const afterLogout = await post("/v1/auth/refresh", { refreshToken: rotated.refreshToken })
assert(afterLogout.status === 401, `refresh after logout expected 401, got ${afterLogout.status}`)

console.log("auth spike ok")
