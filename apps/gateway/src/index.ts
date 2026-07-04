import { z } from "zod"
import { client, type AuthProvider } from "@verse/db"
import { EmailSignupSchema, EmailSigninSchema } from "@verse/types"
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
} from "@verse/auth"

const port = Number(process.env.GATEWAY_PORT) || 2569
const publicUrl = process.env.PUBLIC_URL ?? `http://localhost:${port}`
const isProd = process.env.NODE_ENV === "production"

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000 // must match signRefreshToken's 7d

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization",
  Vary: "Origin",
} satisfies Record<string, string>

// ---- helpers ----------------------------------------------------------------

function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  })
}

function json(body: unknown, status = 200) {
  return withCors(Response.json(body, { status }))
}

function empty(status = 204) {
  return withCors(new Response(null, { status }))
}

function redirect(url: string, status = 302) {
  return withCors(Response.redirect(url, status))
}

function err(status: number, error: string) {
  return json({ error }, status)
}

async function readJson(req: Request): Promise<unknown> {
  return req.json().catch(() => null)
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

Bun.serve({
  port,
  routes: {
    "/v1/auth/signup": {
      POST: async (req) => {
        const parsed = SignupBody.safeParse(await readJson(req))
        if (!parsed.success) return err(400, "invalid signup payload")
        const { email, password, handle } = parsed.data

        const existing = await client.user.findUnique({ where: { email } })
        if (existing) return err(409, "email already registered")

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
          if (e?.code === "P2002") return err(409, "handle taken")
          throw e
        }
        return json(await issueTokens(user), 201)
      },
    },

    "/v1/auth/login": {
      POST: async (req) => {
        const parsed = EmailSigninSchema.safeParse(await readJson(req))
        if (!parsed.success) return err(400, "invalid login payload")
        const { email, password } = parsed.data

        const user = await client.user.findUnique({ where: { email } })
        if (!user?.password) {
          await hashPassword("timing-equalizer") // constant-time-ish: don't reveal user existence
          return err(401, "invalid credentials")
        }
        if (!(await verifyPassword(user.password, password))) {
          return err(401, "invalid credentials")
        }
        return json(await issueTokens(user))
      },
    },

    "/v1/auth/refresh": {
      POST: async (req) => {
        const parsed = RefreshBody.safeParse(await readJson(req))
        if (!parsed.success) return err(400, "refreshToken required")

        const payload = tryVerify(parsed.data.refreshToken)
        if (!payload?.jti || !payload?.userId) return err(401, "invalid refresh token")

        // atomic consume: rotation — old session gone the moment it's used
        const { count } = await client.session.deleteMany({
          where: { jti: payload.jti, expiresAt: { gt: new Date() } },
        })
        if (count === 0) return err(401, "invalid refresh token")

        const user = await client.user.findUnique({ where: { id: payload.userId } })
        if (!user) return err(401, "invalid refresh token")

        return json(await issueTokens(user))
      },
    },

    "/v1/auth/logout": {
      POST: async (req) => {
        const parsed = RefreshBody.safeParse(await readJson(req))
        if (!parsed.success) return err(400, "refreshToken required")

        const payload = tryVerify(parsed.data.refreshToken)
        if (payload?.jti) {
          await client.session.deleteMany({ where: { jti: payload.jti } })
        }
        return empty(204)
      },
    },

    "/v1/auth/magic-link": {
      POST: async (req) => {
        const parsed = MagicLinkBody.safeParse(await readJson(req))
        if (!parsed.success) return err(400, "invalid email")

        const token = await createMagicLink(parsed.data.email)
        // ponytail: no mailer yet — dev logs the link; wire an email provider before prod
        if (!isProd) {
          console.log(`[magic-link] ${publicUrl}/v1/auth/magic-link/verify?token=${token}`)
        }
        return empty(204) // always 204: no user enumeration
      },
    },

    "/v1/auth/magic-link/verify": {
      GET: async (req) => {
        const token = new URL(req.url).searchParams.get("token")
        if (!token) return err(400, "token required")

        const result = await verifyMagicLink(token)
        if (!result) return err(401, "invalid or expired link")

        // ponytail: magic-link/oauth users start with handle=null — set later via a profile endpoint
        const user = await client.user.upsert({
          where: { email: result.email },
          update: {},
          create: { email: result.email },
        })
        return json(await issueTokens(user))
      },
    },

    "/v1/auth/oauth/:provider": {
      GET: (req) => {
        const provider = PROVIDER_PARAM[req.params.provider]
        if (!provider) return err(404, "unknown provider")
        const env = oauthEnv(provider)
        if (!env) return err(501, "provider not configured")

        const state = crypto.randomUUID()
        const now = Date.now()
        for (const [k, v] of pendingStates) if (v.expiresAt < now) pendingStates.delete(k)
        pendingStates.set(state, { provider, expiresAt: now + OAUTH_STATE_TTL_MS })

        return redirect(getAuthorizationUrl(provider, { ...env, state }), 302)
      },
    },

    "/v1/auth/oauth/:provider/callback": {
      GET: async (req) => {
        const provider = PROVIDER_PARAM[req.params.provider]
        if (!provider) return err(404, "unknown provider")
        const env = oauthEnv(provider)
        if (!env) return err(501, "provider not configured")

        const url = new URL(req.url)
        const code = url.searchParams.get("code")
        const state = url.searchParams.get("state")
        if (!code || !state) return err(400, "code and state required")

        const pending = pendingStates.get(state)
        pendingStates.delete(state) // single use
        if (!pending || pending.provider !== provider || pending.expiresAt < Date.now()) {
          return err(400, "invalid state")
        }

        let profile
        try {
          profile = await exchangeCode(provider, code, env)
        } catch (e) {
          console.error(`[oauth] ${provider} exchange failed:`, e instanceof Error ? e.message : e)
          return err(502, "oauth exchange failed")
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
        return Response.json(await issueTokens(user))
      },
    },

    "/v1/me": {
      GET: async (req) => {
        const auth = req.headers.get("authorization")
        if (!auth?.startsWith("Bearer ")) return err(401, "unauthorized")

        const payload = tryVerify(auth.slice(7))
        // refresh tokens carry a jti — reject them here, only access tokens allowed
        if (!payload?.userId || payload.jti) return err(401, "unauthorized")

        const user = await client.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, handle: true, role: true, createdAt: true },
        })
        if (!user) return err(401, "unauthorized")
        return json(user)
      },
    },
  },

  fetch(req) {
    if (req.method === "OPTIONS") return empty(204)
    return err(404, "not found")
  },

  error(e) {
    console.error("[gateway]", e instanceof Error ? e.message : e)
    return err(500, "internal error")
  },
})

console.log(`@verse/gateway on :${port}`)
