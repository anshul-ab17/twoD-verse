import type { RequestHandler } from "express"
import { getSpaces, createSpace } from "../services/space.service"
import { handleError } from "../utils/handleZodError"

export const getSpacesHandler: RequestHandler = async (req, res) => {
  try {
    const spaces = await getSpaces()
    return res.json(spaces)
  } catch (error) {
    return handleError(res, error)
  }
}

export const createSpaceHandler: RequestHandler = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const space = await createSpace(req.userId, req.body)
    return res.status(201).json(space)
  } catch (error) {
    return handleError(res, error)
  }
}