import type { RequestHandler } from "express"
import {
  getSpaces as getSpacesService,
  createSpace as createSpaceService,
  getSpaceById as getSpaceByIdService,
  deleteSpace as deleteSpaceService,
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

export const getSpaceById: RequestHandler = async (req, res) => {
  const spaceId = Array.isArray(req.params.spaceId)
    ? req.params.spaceId[0]
    : req.params.spaceId
  if (!spaceId) {
    return res.status(400).json({ error: "Missing space id" })
  }

  const space = await getSpaceByIdService(spaceId)
  if (!space) {
    return res.status(404).json({ error: "Space not found" })
  }

  return res.json(space)
}

export const deleteSpace: RequestHandler = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const spaceId = Array.isArray(req.params.spaceId)
    ? req.params.spaceId[0]
    : req.params.spaceId
  if (!spaceId) {
    return res.status(400).json({ error: "Missing space id" })
  }

  const result = await deleteSpaceService(req.user.userId, spaceId)
  if (result.status === "not_found") {
    return res.status(404).json({ error: "Space not found" })
  }

  if (result.status === "forbidden") {
    return res.status(403).json({ error: "Forbidden" })
  }

  return res.json({ success: true })
}
