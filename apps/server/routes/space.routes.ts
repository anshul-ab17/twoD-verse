import { Router } from "express"
import {
  getSpaces,
  createSpace,
} from "../controllers/space.controller"
import { requireAuth } from "../middleware/auth.middleware"

export const spaceRouter = Router()

spaceRouter.get("/", requireAuth, getSpaces)
spaceRouter.post("/", requireAuth, createSpace)