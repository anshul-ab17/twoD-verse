import { Router } from "express"
import {
  signupHandler,
  signinHandler,
  logoutHandler,
  meHandler,
} from "../controllers/auth.controller"
import { requireAuth } from "../middleware/auth.middleware"

export const authRouter = Router()

authRouter.post("/signup", signupHandler)
authRouter.post("/signin", signinHandler)
authRouter.post("/logout", requireAuth, logoutHandler)
authRouter.get("/me", requireAuth, meHandler)