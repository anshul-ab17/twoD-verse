import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { getIceServers } from "../controllers/rtc.controller"

export const rtcRouter = Router()

rtcRouter.get("/ice-servers", requireAuth, getIceServers)
