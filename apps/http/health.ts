import { Router } from "express"

export const healthRoute = Router()

healthRoute.get("/", (_, res) => {
  res.json({ status: "ok" })
})
