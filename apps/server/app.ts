import express from "express"
import cookieParser from "cookie-parser"
import passport from "./config/passport"
import { authRouter } from "./routes/auth.routes"
import { spaceRouter } from "./routes/space.routes"
import { adminRouter } from "./routes/admin.routes"
import { spotifyRouter } from "./routes/spotify.routes"
import { userRouter } from "./routes/user.routes"
import helmet from "helmet"
import cors from "cors"
import { errorMiddleware } from "./middleware/error.middleware"

export const app = express()

app.use(helmet())

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())
app.use(passport.initialize())

// routes
app.use("/api/auth", authRouter)
app.use("/api/spaces", spaceRouter)
app.use("/api/admin", adminRouter)
app.use("/api/spotify", spotifyRouter)
app.use("/api/users", userRouter)

// health 
app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

// error middleware 
app.use(errorMiddleware)
