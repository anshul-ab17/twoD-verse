import type { RequestHandler } from "express"
import { TURN_URL, TURN_USERNAME, TURN_CREDENTIAL } from "../config/env"

type IceServer =
  | { urls: string }
  | { urls: string; username: string; credential: string }

export const getIceServers: RequestHandler = (_req, res) => {
  const iceServers: IceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
  ]

  if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
    iceServers.push({ urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL })
  }

  return res.json({ iceServers })
}
