import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { searchSpotifyTracksController } from "../controllers/spotify.controller"

export const spotifyRouter = Router()

spotifyRouter.get("/search", requireAuth, searchSpotifyTracksController)
