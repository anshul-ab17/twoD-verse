import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { searchUsers, batchUsers } from "../controllers/user.controller"

export const userRouter = Router()

userRouter.get("/search", requireAuth, searchUsers)
userRouter.get("/batch", requireAuth, batchUsers)
