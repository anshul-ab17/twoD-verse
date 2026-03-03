import { Router } from "express"
import { requireAuth } from "../middleware/auth.middleware"
import { requireRole } from "../middleware/role.middleware"

export const adminRouter = Router()

adminRouter.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN"),
  (_req, res) => {
    res.json({
      message: "Admin only",
    })
  }
)