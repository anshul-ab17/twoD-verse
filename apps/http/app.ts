import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { authRouter } from "./routes/auth.routes"

import { healthRoute } from "./health"
import { spaceRouter } from "./routes/space.router"

export const app = express()

app.use(cors())
app.use(express.json())

app.use("/health", healthRoute)
app.use(cookieParser())
app.use("/auth", authRouter)
app.use("/space", spaceRouter)


// Add Redis pub/sub so multiple WS instances sync
// Add refresh token system
//  Add role-based permissions
// sidepanel -> shadcn component

// Persist chat to DB
// Add server-side collision detection
//  Add authoritative movement tick system
//smooth movement.
