import express from "express"
import cors from "cors"

import { healthRoute } from "./health"

export const app = express()

app.use(cors())
app.use(express.json())

app.use("/health", healthRoute)
