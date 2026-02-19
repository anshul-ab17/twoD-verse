import { ZodError } from "zod"
import  type { Response } from "express"

export function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Invalid input",
      details: error.issues,
    })
  }

  return res.status(400).json({
    error: (error as Error).message,
  })
}
