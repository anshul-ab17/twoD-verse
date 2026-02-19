import type { Request, Response, } from "express"
import { client } from "@repo/db"

export async function getSpaces(_req: Request, res: Response) {
  const spaces = await client.space.findMany()
  res.json(spaces)
}
