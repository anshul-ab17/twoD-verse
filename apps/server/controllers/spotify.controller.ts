import type { Request, Response, NextFunction } from "express"
import { searchSpotifyTracks } from "../services/spotify.service"

export async function searchSpotifyTracksController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : ""
    if (!query.trim()) {
      return res.status(400).json({ error: "Query parameter q is required" })
    }

    const tracks = await searchSpotifyTracks(query)
    return res.status(200).json({ tracks })
  } catch (error) {
    next(error)
  }
}
