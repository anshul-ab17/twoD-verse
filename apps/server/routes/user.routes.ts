import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { strictLimiter } from "../middleware/rateLimit.middleware"
import { searchUsers, batchUsers } from "../controllers/user.controller"

export const userRouter = Router()

userRouter.get("/search", requireAuth, strictLimiter, searchUsers)
userRouter.get("/batch", requireAuth, batchUsers)
