import type { Request, Response, NextFunction } from "express"

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err)

  if (err.message === "Invalid credentials") {
    return res.status(401).json({ error: err.message })
  }

  if (err.message === "User already exists") {
    return res.status(400).json({ error: err.message })
  }

  return res.status(500).json({
    error: "Internal Server Error",
  })
}