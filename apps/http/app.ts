import express from "express"
import cookieParser from "cookie-parser"
import passport from "./config/passport"
import { authRouter } from "./routes/auth.routes"
import { spaceRouter } from "./routes/space.routes"
import helmet from "helmet"
import cors from "cors"
import { adminRouter } from "./routes/admin.routes"


export const app = express()

app.use(helmet())
app.use(passport.initialize())
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/spaces", spaceRouter)
app.use("/api/admin", adminRouter) 

// Add Redis pub/sub so multiple WS instances sync
// Add refresh token system
//  Add role-based permissions
// sidepanel -> shadcn component

// Persist chat to DB
// Add server-side collision detection
//  Add authoritative movement tick system
//smooth movement.
