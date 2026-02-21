import express from "express"
import cookieParser from "cookie-parser"
import { authRouter } from "./routes/auth.routes"
import { spaceRouter } from "./routes/space.routes"
import { errorMiddleware } from "./middleware/error.middleware"

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/spaces", spaceRouter);

app.use(errorMiddleware);



// Add Redis pub/sub so multiple WS instances sync
// Add refresh token system
//  Add role-based permissions
// sidepanel -> shadcn component

// Persist chat to DB
// Add server-side collision detection
//  Add authoritative movement tick system
//smooth movement.
