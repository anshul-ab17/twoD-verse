import { Router } from "express"
import { signupHandler, signinHandler } from "../controllers/auth.controller"

export const authRouter = Router()

authRouter.post("/signup", signupHandler)
authRouter.post("/signin", signinHandler)
