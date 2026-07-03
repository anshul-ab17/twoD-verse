import { z } from "zod"

const PROVIDERS = {
  GOOGLE: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
  },
  GITHUB: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scope: "read:user user:email",
  },
} as const

export type OAuthProvider = keyof typeof PROVIDERS

const tokenResponseSchema = z.object({ access_token: z.string().min(1) })

const googleUserSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
})

const githubUserSchema = z.object({
  id: z.number(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
})

const githubEmailsSchema = z.array(
  z.object({ email: z.string().email(), primary: z.boolean(), verified: z.boolean() })
)

export function getAuthorizationUrl(
  provider: OAuthProvider,
  opts: { clientId: string; redirectUri: string; state: string }
) {
  const { authUrl, scope } = PROVIDERS[provider]
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope,
    response_type: "code",
  })
  return `${authUrl}?${params}`
}

export async function exchangeCode(
  provider: OAuthProvider,
  code: string,
  opts: { clientId: string; clientSecret: string; redirectUri: string }
) {
  const { tokenUrl, userInfoUrl } = PROVIDERS[provider]

  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: opts.clientId,
      client_secret: opts.clientSecret,
      redirect_uri: opts.redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  })
  if (!tokenRes.ok) throw new Error(`${provider} token exchange failed (${tokenRes.status})`)
  const { access_token } = tokenResponseSchema.parse(await tokenRes.json())

  const userRes = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" },
  })
  if (!userRes.ok) throw new Error(`${provider} userinfo fetch failed (${userRes.status})`)
  const raw = await userRes.json()

  if (provider === "GOOGLE") {
    const user = googleUserSchema.parse(raw)
    return { providerAccountId: user.sub, email: user.email, name: user.name }
  }

  const user = githubUserSchema.parse(raw)
  let email = user.email
  if (!email) {
    // GitHub hides email on the user endpoint when set to private
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access_token}`, Accept: "application/json" },
    })
    if (!emailsRes.ok) throw new Error(`GITHUB emails fetch failed (${emailsRes.status})`)
    const emails = githubEmailsSchema.parse(await emailsRes.json())
    email = emails.find((e) => e.primary && e.verified)?.email ?? null
  }
  if (!email) throw new Error("GITHUB account has no verified primary email")

  return { providerAccountId: String(user.id), email, name: user.name ?? undefined }
}

// self-check: bun packages/auth/oauth.service.ts
if (import.meta.main) {
  const url = new URL(
    getAuthorizationUrl("GOOGLE", {
      clientId: "cid",
      redirectUri: "http://localhost/cb",
      state: "xyz",
    })
  )
  console.assert(url.origin + url.pathname === PROVIDERS.GOOGLE.authUrl, "auth url base")
  console.assert(url.searchParams.get("client_id") === "cid", "client_id")
  console.assert(url.searchParams.get("redirect_uri") === "http://localhost/cb", "redirect_uri")
  console.assert(url.searchParams.get("state") === "xyz", "state")
  console.assert(url.searchParams.get("response_type") === "code", "response_type")
  console.assert(getAuthorizationUrl("GITHUB", { clientId: "c", redirectUri: "r", state: "s" }).startsWith(PROVIDERS.GITHUB.authUrl + "?"), "github base")
  console.log("oauth.service self-check passed")
}
