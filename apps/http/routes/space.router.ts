import { Router } from "express"
import { getSpaces } from "../controllers/space.controller"

export const spaceRouter = Router()

spaceRouter.get("/", getSpaces)
