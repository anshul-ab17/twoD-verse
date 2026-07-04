// Tiny gateway auth client (plan §6): access JWT on every surface.
// ponytail: tokens in memory + localStorage — readable by XSS. Move refresh
// token to an httpOnly cookie once the gateway sits behind the app origin.

export const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:2569"

export type TokenPair = { accessToken: string; refreshToken: string }

let accessToken: string | null = null

function store(pair: TokenPair): TokenPair {
  accessToken = pair.accessToken
  localStorage.setItem("accessToken", pair.accessToken)
  localStorage.setItem("refreshToken", pair.refreshToken)
  return pair
}

async function post(path: string, body: unknown): Promise<TokenPair> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res
      .json()
      .then((j) => (j as { error?: string })?.error)
      .catch(() => null)
    throw new Error(msg ?? `auth request failed (${res.status})`)
  }
  return store((await res.json()) as TokenPair)
}

export const signup = (email: string, password: string) =>
  post("/v1/auth/signup", { email, password })

export const login = (email: string, password: string) =>
  post("/v1/auth/login", { email, password })

/** Rotate tokens using the stored refresh token; null (and cleared) on failure. */
export async function refresh(): Promise<TokenPair | null> {
  const refreshToken = localStorage.getItem("refreshToken")
  if (!refreshToken) return null
  try {
    return await post("/v1/auth/refresh", { refreshToken })
  } catch {
    clearTokens()
    return null
  }
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== "undefined") {
    accessToken = localStorage.getItem("accessToken")
  }
  return accessToken
}

export function clearTokens() {
  accessToken = null
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}
