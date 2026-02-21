import type { RequestHandler } from "express"
import {
  getSpaces as getSpacesService,
  createSpace as createSpaceService,
} from "../services/space.service"

export const getSpaces: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const spaces = await getSpacesService(req.user.userId)

  return res.json(spaces)
}

export const createSpace: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { name, width, height } = req.body

  if (!name || !width || !height) {
    return res.status(400).json({ error: "Invalid input" })
  }

  const space = await createSpaceService(req.user.userId, {
    name,
    width,
    height,
  })

  return res.status(201).json(space)
}