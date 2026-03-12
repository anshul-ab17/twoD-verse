const REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3001/api/spotify/callback"

type TokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

type SpotifySearchResponse = {
  tracks?: {
    items?: Array<{
      id: string
      name: string
      preview_url: string | null
      external_urls?: { spotify?: string }
      artists?: Array<{ name?: string }>
      album?: {
        name?: string
        images?: Array<{ url?: string }>
      }
    }>
  }
}

// ── Client Credentials (for fallback server-side search) ──────────────────────
let ccToken: string | null = null
let ccExpiry = 0

async function getClientCredentialsToken() {
  const now = Date.now()
  if (ccToken && now < ccExpiry - 30_000) return ccToken

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error("Spotify credentials missing")

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  })
  if (!res.ok) throw new Error(`Spotify CC token failed (${res.status})`)

  const payload = await res.json() as TokenResponse
  ccToken = payload.access_token
  ccExpiry = now + payload.expires_in * 1000
  return ccToken
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ")

export function buildSpotifyAuthUrl(state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  if (!clientId) throw new Error("SPOTIFY_CLIENT_ID missing")

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
  })
  return `https://accounts.spotify.com/authorize?${params}`
}

export async function exchangeSpotifyCode(code: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Spotify code exchange failed (${res.status})`)

  const data = await res.json() as TokenResponse
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? "",
    expiresIn: data.expires_in,
  }
}

export async function refreshSpotifyAccessToken(refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  })
  if (!res.ok) throw new Error(`Spotify refresh failed (${res.status})`)

  const data = await res.json() as TokenResponse
  return { accessToken: data.access_token, expiresIn: data.expires_in }
}

// ── Search ────────────────────────────────────────────────────────────────────
export async function searchSpotifyTracks(query: string, userToken?: string) {
  const normalized = query.trim()
  if (!normalized) return []

  // Prefer user token (avoids 403 with client credentials); fall back to CC token
  const token = userToken ?? await getClientCredentialsToken()
  const url = `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(normalized)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

  if (!res.ok) throw new Error(`Spotify search failed (${res.status})`)

  const payload = await res.json() as SpotifySearchResponse
  const items = payload.tracks?.items ?? []

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    artists: (item.artists ?? []).map((a) => a.name || "").filter(Boolean).join(", "),
    album: item.album?.name || "Unknown album",
    imageUrl: item.album?.images?.[0]?.url || null,
    previewUrl: item.preview_url,
    spotifyUrl: item.external_urls?.spotify || null,
  }))
}
