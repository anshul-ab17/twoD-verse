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

export const authRouter = Router()

//email 
authRouter.post("/signup", signupHandler)
authRouter.post("/signin", signinHandler)
authRouter.post("/refresh", refreshHandler)
authRouter.post("/logout", requireAuth, logoutHandler)
authRouter.get("/me", requireAuth, meHandler)
authRouter.patch("/me/password", requireAuth, changePasswordHandler)

authRouter.delete(
  "/sessions/:jti",
  requireAuth,
  revokeSessionHandler
)

//google oauth
authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
)

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const { accessToken } = req.user as any

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })

    res.redirect("http://localhost:3000/dashboard")
  }
)

// github oauth
authRouter.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
)

authRouter.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const accessToken = req.user!.accessToken!

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })

    res.redirect("http://localhost:3000/dashboard")
  }
)
