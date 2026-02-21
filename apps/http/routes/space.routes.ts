import { Router } from "express"
import {
  getSpacesHandler,
  createSpaceHandler,
} from "../controllers/space.controller"
import { requireAuth } from "../middleware/auth.middleware"

export const spaceRouter = Router()

spaceRouter.get("/", requireAuth, getSpacesHandler)
spaceRouter.post("/", requireAuth, createSpaceHandler)