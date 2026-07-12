import type { Request, Response, NextFunction } from "express"
import {
  buildSpotifyAuthUrl,
  exchangeSpotifyCode,
  refreshSpotifyAccessToken,
  searchSpotifyTracks,
} from "../services/spotify.service"

const WEB_BASE = process.env.WEB_BASE_URL || "http://localhost:3000"

export function spotifyAuthController(req: Request, res: Response) {
  const returnTo =
    typeof req.query.return_to === "string"
      ? req.query.return_to
      : `${WEB_BASE}/dashboard`

  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64")
  try {
    const url = buildSpotifyAuthUrl(state)
    res.redirect(url)
  } catch (err) {
    res.redirect(`${WEB_BASE}/dashboard?spotify_error=config`)
  }
}

export async function spotifyCallbackController(req: Request, res: Response) {
  const { code, state, error } = req.query

  if (error || !code || !state) {
    return res.redirect(`${WEB_BASE}/dashboard?spotify_error=${error || "cancelled"}`)
  }

  try {
    const { returnTo } = JSON.parse(
      Buffer.from(state as string, "base64").toString()
    ) as { returnTo: string }

    const tokens = await exchangeSpotifyCode(code as string)

    const dest = new URL(returnTo)
    dest.searchParams.set("spotify_token", tokens.accessToken)
    dest.searchParams.set("spotify_refresh", tokens.refreshToken)
    dest.searchParams.set("spotify_expires_in", String(tokens.expiresIn))

    res.redirect(dest.toString())
  } catch {
    res.redirect(`${WEB_BASE}/dashboard?spotify_error=callback_failed`)
  }
}

export async function spotifyRefreshController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { refresh_token } = req.body as { refresh_token?: string }
    if (!refresh_token) return res.status(400).json({ error: "refresh_token required" })

    const tokens = await refreshSpotifyAccessToken(refresh_token)
    return res.json({ access_token: tokens.accessToken, expires_in: tokens.expiresIn })
  } catch (error) {
    next(error)
  }
}

export async function searchSpotifyTracksController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : ""
    if (!query.trim()) return res.status(400).json({ error: "Query parameter q is required" })

    // Use user token from Authorization header if provided
    const authHeader = req.headers["x-spotify-token"]
    const userToken = typeof authHeader === "string" ? authHeader : undefined

    const tracks = await searchSpotifyTracks(query, userToken)
    return res.status(200).json({ tracks })
  } catch (error) {
    next(error)
  }
}
