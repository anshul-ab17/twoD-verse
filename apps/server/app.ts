import express from "express"
import cookieParser from "cookie-parser"
import passport from "./config/passport"
import { authRouter } from "./routes/auth.routes"
import { spaceRouter } from "./routes/space.routes"
import { adminRouter } from "./routes/admin.routes"
import { spotifyRouter } from "./routes/spotify.routes"
import { userRouter } from "./routes/user.routes"
import { rtcRouter } from "./routes/rtc.routes"
import { friendsRouter } from "./routes/friends.routes"
import helmet from "helmet"
import cors from "cors"
import { errorMiddleware } from "./middleware/error.middleware"
import { apiLimiter, strictLimiter } from "./middleware/rateLimit.middleware"

const ALLOWED_ORIGIN = process.env.WEB_BASE_URL || "http://localhost:3000"

export const app = express()

// Trust the first proxy hop (nginx, Cloud Run, etc.) for correct client IP
app.set("trust proxy", 1)

app.use(helmet({
  crossOriginEmbedderPolicy: false,
}))

app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    credentials: true,
  })
)

// Cap request bodies to prevent memory exhaustion from large payloads
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: false, limit: "16kb" }))
app.use(cookieParser())
app.use(passport.initialize())

// Global DDoS / request-flood protection
app.use(apiLimiter)

// routes
app.use("/api/auth", authRouter)
app.use("/api/spaces", spaceRouter)
app.use("/api/admin", adminRouter)
app.use("/api/spotify", spotifyRouter)
app.use("/api/users", userRouter)
app.use("/api/rtc", rtcRouter)
app.use("/api/friends", friendsRouter)

// health 
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// error middleware 
app.use(errorMiddleware)
