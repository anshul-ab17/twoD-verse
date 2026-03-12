import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import {
  spotifyAuthController,
  spotifyCallbackController,
  spotifyRefreshController,
  searchSpotifyTracksController,
} from "../controllers/spotify.controller"

export const spotifyRouter = Router()

// OAuth flow — no auth required (browser redirects)
spotifyRouter.get("/auth", spotifyAuthController)
spotifyRouter.get("/callback", spotifyCallbackController)

// Refresh user token
spotifyRouter.post("/refresh", requireAuth, spotifyRefreshController)

// Search
spotifyRouter.get("/search", requireAuth, searchSpotifyTracksController)
