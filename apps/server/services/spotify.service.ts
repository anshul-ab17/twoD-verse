type SpotifyTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
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

let spotifyAccessToken: string | null = null
let spotifyTokenExpiry = 0

async function getSpotifyAccessToken() {
  const now = Date.now()
  if (spotifyAccessToken && now < spotifyTokenExpiry - 30_000) {
    return spotifyAccessToken
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are missing")
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const body = new URLSearchParams({ grant_type: "client_credentials" })

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    throw new Error(`Spotify token request failed (${response.status})`)
  }

  const payload = await response.json() as SpotifyTokenResponse
  spotifyAccessToken = payload.access_token
  spotifyTokenExpiry = now + payload.expires_in * 1000
  return spotifyAccessToken
}

export async function searchSpotifyTracks(query: string) {
  const normalized = query.trim()
  if (!normalized) return []

  const token = await getSpotifyAccessToken()
  const url = `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(normalized)}`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Spotify search failed (${response.status})`)
  }

  const payload = await response.json() as SpotifySearchResponse
  const items = payload.tracks?.items ?? []

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    artists: (item.artists ?? []).map((artist) => artist.name || "").filter(Boolean).join(", "),
    album: item.album?.name || "Unknown album",
    imageUrl: item.album?.images?.[0]?.url || null,
    previewUrl: item.preview_url,
    spotifyUrl: item.external_urls?.spotify || null,
  }))
}
