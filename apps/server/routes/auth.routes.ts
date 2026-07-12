import { Router } from "express"
import passport from "passport"

import {
  signupHandler,
  signinHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  changePasswordHandler,
  revokeSessionHandler,
} from "../controllers/auth.controller"

import { requireAuth } from "../middleware/auth.middleware"
import { authLimiter } from "../middleware/rateLimit.middleware"

export const authRouter = Router()

//email
authRouter.post("/signup", authLimiter, signupHandler)
authRouter.post("/signin", authLimiter, signinHandler)
authRouter.post("/refresh", authLimiter, refreshHandler)
authRouter.post("/logout", requireAuth, logoutHandler)
authRouter.get("/me", requireAuth, meHandler)
authRouter.patch("/me/password", requireAuth, changePasswordHandler)

authRouter.delete(
  "/sessions/:jti",
  requireAuth,
  revokeSessionHandler
)

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET
const githubEnabled = !!process.env.GitHub_CLIENT_ID && !!process.env.GitHub_CLIENT_SECRET

const oauthNotConfigured = (name: string) => (_req: any, res: any) =>
  res.status(501).json({ error: `${name} OAuth not configured` })

authRouter.get(
  "/google",
  googleEnabled
    ? passport.authenticate("google", { scope: ["profile", "email"], session: false })
    : oauthNotConfigured("Google")
)

authRouter.get(
  "/google/callback",
  googleEnabled
    ? passport.authenticate("google", { session: false, failureRedirect: "http://localhost:3000/?auth=error" })
    : oauthNotConfigured("Google"),
  (req, res) => {
    const { accessToken } = req.user as any
    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "strict" })
    res.redirect("http://localhost:3000/spaces")
  }
)

authRouter.get(
  "/github",
  githubEnabled
    ? passport.authenticate("github", { scope: ["user:email"], session: false })
    : oauthNotConfigured("GitHub")
)

authRouter.get(
  "/github/callback",
  githubEnabled
    ? passport.authenticate("github", { session: false, failureRedirect: "http://localhost:3000/?auth=error" })
    : oauthNotConfigured("GitHub"),
  (req, res) => {
    const accessToken = (req.user as any).accessToken
    res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "strict" })
    res.redirect("http://localhost:3000/spaces")
  }
)
