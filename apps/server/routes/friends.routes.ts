import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { strictLimiter } from "../middleware/rateLimit.middleware"
import {
  getFriends,
  sendFriendRequest,
  getPendingRequests,
  respondToRequest,
  removeFriend,
} from "../controllers/friends.controller"

export const friendsRouter = Router()

friendsRouter.get("/", requireAuth, getFriends)
friendsRouter.post("/request", requireAuth, strictLimiter, sendFriendRequest)
friendsRouter.get("/requests/pending", requireAuth, getPendingRequests)
friendsRouter.patch("/request/:requestId", requireAuth, respondToRequest)
friendsRouter.delete("/:userId", requireAuth, removeFriend)
