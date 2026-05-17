import { Router } from "express"
import {
  getSpaces,
  createSpace,
  getSpaceById,
  deleteSpace,
  getMessages,
} from "../controllers/space.controller"
import { requireAuth } from "../middleware/auth.middleware"

export const spaceRouter = Router()

spaceRouter.get("/", requireAuth, getSpaces)
spaceRouter.post("/", requireAuth, createSpace)
spaceRouter.get("/:spaceId", requireAuth, getSpaceById)
spaceRouter.delete("/:spaceId", requireAuth, deleteSpace)
spaceRouter.get("/:spaceId/messages", requireAuth, getMessages)
