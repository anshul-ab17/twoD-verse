import express, { type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import { z } from "zod"
import { client, type AuthProvider } from "@repo/db"
import { redis, connectRedis } from "@repo/pubsub"
import { EmailSignupSchema, EmailSigninSchema } from "@repo/types"
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  createMagicLink,
  verifyMagicLink,
  getAuthorizationUrl,
  exchangeCode,
  type OAuthProvider,
} from "@repo/auth"

const port = Number(process.env.GATEWAY_PORT) || 2569
const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}`
const isProd = process.env.NODE_ENV === "production"

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // must match signRefreshToken's 7d

// ---- helpers ----------------------------------------------------------------

function err(res: Response, status: number, error: string) {
  res.status(status).json({ error })
}

/** Issue access+refresh pair and persist the session row (v1 dual-token model). */
async function issueTokens(user: { id: string; role: string }) {
  const accessToken = signAccessToken(user.id, user.role)
  const { token: refreshToken, jti } = signRefreshToken(user.id)
  await client.session.create({
    data: { userId: user.id, jti, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  })
  return { accessToken, refreshToken }
}

function tryVerify(token: string): any | null {
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

/** Access-JWT bearer gate; sets req.userId. Refresh tokens (jti) rejected. */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  const payload = auth?.startsWith("Bearer ") ? tryVerify(auth.slice(7)) : null
  if (!payload?.userId || payload.jti) return err(res, 401, "unauthorized")
  ;(req as Request & { userId: string }).userId = payload.userId
  next()
}

const userIdOf = (req: Request) => (req as Request & { userId: string }).userId

// ---- oauth state ------------------------------------------------------------
// ponytail: in-memory state map — single instance only; move to Redis (SET EX)
// when the gateway runs multi-instance.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const pendingStates = new Map<string, { provider: OAuthProvider; expiresAt: number }>()

const PROVIDER_PARAM: Record<string, OAuthProvider> = { google: "GOOGLE", github: "GITHUB" }

function oauthEnv(provider: OAuthProvider) {
  const clientId = process.env[`${provider}_CLIENT_ID`]
  const clientSecret = process.env[`${provider}_CLIENT_SECRET`]
  if (!clientId || !clientSecret) return null
  return {
    clientId,
    clientSecret,
    redirectUri: `${publicUrl}/v1/auth/oauth/${provider.toLowerCase()}/callback`,
  }
}

// ---- schemas ----------------------------------------------------------------

const SignupBody = EmailSignupSchema.extend({ handle: z.string().min(1).optional() })
const RefreshBody = z.object({ refreshToken: z.string().min(1) })
const MagicLinkBody = z.object({ email: z.email() })

// ---- server -----------------------------------------------------------------

const app = express()

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
  }),
)

// malformed/missing JSON → body undefined, so zod produces the route's own 400
// (matches the old readJson-returns-null behavior)
const parseJson = express.json()
app.use((req, res, next) => {
  parseJson(req, res, (e?: unknown) => {
    if (e) req.body = undefined
    next()
  })
})

app.post("/v1/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "invalid signup payload")
  const { email, password, handle } = parsed.data

  const existing = await client.user.findUnique({ where: { email } })
  if (existing) return err(res, 409, "email already registered")

  let user
  try {
    user = await client.user.create({
      data: {
        email,
        handle,
        password: await hashPassword(password),
        accounts: { create: { provider: "EMAIL", providerId: email } },
      },
    })
  } catch (e: any) {
    // P2002 = unique violation; email checked above, so it's the handle
    if (e?.code === "P2002") return err(res, 409, "handle taken")
    throw e
  }
  res.status(201).json(await issueTokens(user))
})

app.post("/v1/auth/login", async (req, res) => {
  const parsed = EmailSigninSchema.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "invalid login payload")
  const { email, password } = parsed.data

  const user = await client.user.findUnique({ where: { email } })
  if (!user?.password) {
    await hashPassword("timing-equalizer") // constant-time-ish: don't reveal user existence
    return err(res, 401, "invalid credentials")
  }
  if (!(await verifyPassword(user.password, password))) {
    return err(res, 401, "invalid credentials")
  }
  res.json(await issueTokens(user))
})

app.post("/v1/auth/refresh", async (req, res) => {
  const parsed = RefreshBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "refreshToken required")

  const payload = tryVerify(parsed.data.refreshToken)
  if (!payload?.jti || !payload?.userId) return err(res, 401, "invalid refresh token")

  // atomic consume: rotation — old session gone the moment it's used
  const { count } = await client.session.deleteMany({
    where: { jti: payload.jti, expiresAt: { gt: new Date() } },
  })
  if (count === 0) return err(res, 401, "invalid refresh token")

  const user = await client.user.findUnique({ where: { id: payload.userId } })
  if (!user) return err(res, 401, "invalid refresh token")

  res.json(await issueTokens(user))
})

app.post("/v1/auth/logout", async (req, res) => {
  const parsed = RefreshBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "refreshToken required")

  const payload = tryVerify(parsed.data.refreshToken)
  if (payload?.jti) {
    await client.session.deleteMany({ where: { jti: payload.jti } })
  }
  res.status(204).end()
})

app.post("/v1/auth/magic-link", async (req, res) => {
  const parsed = MagicLinkBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "invalid email")

  const token = await createMagicLink(parsed.data.email)
  // ponytail: no mailer yet — dev logs the link; wire an email provider before prod
  if (!isProd) {
    console.log(`[magic-link] ${publicUrl}/v1/auth/magic-link/verify?token=${token}`)
  }
  res.status(204).end() // always 204: no user enumeration
})

app.get("/v1/auth/magic-link/verify", async (req, res) => {
  const token = typeof req.query.token === "string" ? req.query.token : null
  if (!token) return err(res, 400, "token required")

  const result = await verifyMagicLink(token)
  if (!result) return err(res, 401, "invalid or expired link")

  // ponytail: magic-link/oauth users start with handle=null — set later via a profile endpoint
  const user = await client.user.upsert({
    where: { email: result.email },
    update: {},
    create: { email: result.email },
  })
  res.json(await issueTokens(user))
})

app.get("/v1/auth/oauth/:provider", (req, res) => {
  const provider = PROVIDER_PARAM[req.params.provider]
  if (!provider) return err(res, 404, "unknown provider")
  const env = oauthEnv(provider)
  if (!env) return err(res, 501, "provider not configured")

  const state = crypto.randomUUID()
  const now = Date.now()
  for (const [k, v] of pendingStates) if (v.expiresAt < now) pendingStates.delete(k)
  pendingStates.set(state, { provider, expiresAt: now + OAUTH_STATE_TTL_MS })

  res.redirect(302, getAuthorizationUrl(provider, { ...env, state }))
})

app.get("/v1/auth/oauth/:provider/callback", async (req, res) => {
  const provider = PROVIDER_PARAM[req.params.provider]
  if (!provider) return err(res, 404, "unknown provider")
  const env = oauthEnv(provider)
  if (!env) return err(res, 501, "provider not configured")

  const code = typeof req.query.code === "string" ? req.query.code : null
  const state = typeof req.query.state === "string" ? req.query.state : null
  if (!code || !state) return err(res, 400, "code and state required")

  const pending = pendingStates.get(state)
  pendingStates.delete(state) // single use
  if (!pending || pending.provider !== provider || pending.expiresAt < Date.now()) {
    return err(res, 400, "invalid state")
  }

  let profile
  try {
    profile = await exchangeCode(provider, code, env)
  } catch (e) {
    console.error(`[oauth] ${provider} exchange failed:`, e instanceof Error ? e.message : e)
    return err(res, 502, "oauth exchange failed")
  }

  const account = await client.account.findUnique({
    where: {
      provider_providerId: {
        provider: provider as AuthProvider,
        providerId: profile.providerAccountId,
      },
    },
    include: { user: true },
  })
  let user = account?.user
  if (!user) {
    user = await client.user.upsert({
      where: { email: profile.email },
      update: {},
      create: { email: profile.email },
    })
    await client.account.create({
      data: {
        userId: user.id,
        provider: provider as AuthProvider,
        providerId: profile.providerAccountId,
      },
    })
  }
  res.json(await issueTokens(user))
})

app.get("/v1/me", requireAuth, async (req, res) => {
  const user = await client.user.findUnique({
    where: { id: userIdOf(req) },
    select: { id: true, email: true, handle: true, role: true, createdAt: true },
  })
  if (!user) return err(res, 401, "unauthorized")
  res.json(user)
})

// ---- friends (plan §7) --------------------------------------------------------
// Persisted in the v1 tables: FriendRequest = pending edge, Friendship = accepted
// (canonical sorted pair). Presence read from Redis presence:world sorted set.

const FriendRequestBody = z.object({ handle: z.string().min(1) })
const FriendRespondBody = z.object({ requestId: z.string().min(1), accept: z.boolean() })

const PRESENCE_KEY = "presence:world"
const ONLINE_WINDOW_MS = 90_000

app.post("/v1/friends/request", requireAuth, async (req, res) => {
  const parsed = FriendRequestBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "handle required")
  const me = userIdOf(req)

  const target = await client.user.findUnique({ where: { handle: parsed.data.handle } })
  if (!target) return err(res, 404, "unknown handle")
  if (target.id === me) return err(res, 400, "cannot friend yourself")

  const [a, b] = [me, target.id].sort()
  const existing = await Promise.all([
    client.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: me, receiverId: target.id },
          { senderId: target.id, receiverId: me },
        ],
      },
    }),
    client.friendship.findUnique({ where: { userAId_userBId: { userAId: a!, userBId: b! } } }),
  ])
  if (existing[0] || existing[1]) return err(res, 409, "already requested or friends")

  const request = await client.friendRequest.create({
    data: { senderId: me, receiverId: target.id },
  })
  res.status(201).json({ id: request.id })
})

app.post("/v1/friends/respond", requireAuth, async (req, res) => {
  const parsed = FriendRespondBody.safeParse(req.body)
  if (!parsed.success) return err(res, 400, "requestId and accept required")
  const me = userIdOf(req)

  const request = await client.friendRequest.findUnique({ where: { id: parsed.data.requestId } })
  // 404 for both missing and not-mine: don't leak other users' request ids
  if (!request || request.receiverId !== me || request.status !== "PENDING") {
    return err(res, 404, "request not found")
  }

  if (parsed.data.accept) {
    const [a, b] = [request.senderId, request.receiverId].sort()
    await client.$transaction([
      client.friendRequest.delete({ where: { id: request.id } }),
      client.friendship.create({ data: { userAId: a!, userBId: b! } }),
    ])
  } else {
    // ponytail: reject = delete the row — sender may re-request; add REJECTED
    // status if request-spam becomes a problem
    await client.friendRequest.delete({ where: { id: request.id } })
  }
  res.json({ accepted: parsed.data.accept })
})

app.get("/v1/friends", requireAuth, async (req, res) => {
  const me = userIdOf(req)
  const handleSel = { select: { id: true, handle: true } }

  const [friendships, requests] = await Promise.all([
    client.friendship.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      include: { userA: handleSel, userB: handleSel },
    }),
    client.friendRequest.findMany({
      where: { status: "PENDING", OR: [{ senderId: me }, { receiverId: me }] },
      include: { sender: handleSel, receiver: handleSel },
    }),
  ])

  const others = friendships.map((f) => (f.userAId === me ? f.userB : f.userA))
  let scores: (number | null)[] = []
  if (others.length) {
    await connectRedis()
    scores = await redis.zmScore(PRESENCE_KEY, others.map((u) => u.id))
  }
  const now = Date.now()

  res.json({
    friends: others.map((u, i) => {
      const seen = scores[i]
      return { userId: u.id, handle: u.handle, online: seen != null && now - seen < ONLINE_WINDOW_MS }
    }),
    pending: {
      incoming: requests
        .filter((r) => r.receiverId === me)
        .map((r) => ({ id: r.id, handle: r.sender.handle })),
      outgoing: requests
        .filter((r) => r.senderId === me)
        .map((r) => ({ id: r.id, handle: r.receiver.handle })),
    },
  })
})

app.get("/v1/leaderboard", requireAuth, async (req, res) => {
  const me = userIdOf(req)
  // ponytail: two small queries per request — Redis zset leaderboard when it's hot
  const [top, mine] = await Promise.all([
    client.user.findMany({
      orderBy: { xp: "desc" },
      take: 10,
      select: { id: true, handle: true, xp: true, level: true },
    }),
    client.user.findUnique({ where: { id: me }, select: { xp: true } }),
  ])
  const rank = mine ? (await client.user.count({ where: { xp: { gt: mine.xp } } })) + 1 : null
  res.json({
    top: top.map((u, i) => ({ rank: i + 1, userId: u.id, handle: u.handle, xp: u.xp, level: u.level })),
    me: { rank, xp: mine?.xp ?? 0 },
  })
})

app.use((_req, res) => err(res, 404, "not found"))

app.use((e: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[gateway]", e instanceof Error ? e.message : e)
  err(res, 500, "internal error")
})

app.listen(port, () => console.log(`@repo/gateway on :${port}`))
