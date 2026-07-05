import { AccessToken } from "livekit-server-sdk"

export interface MintZoneTokenOpts {
  identity: string
  zoneId: string
  canPublish: boolean
}

/** LiveKit access token for the room named zoneId (plan §6: enter zone -> LiveKit room = zoneId). */
export async function mintZoneToken({
  identity,
  zoneId,
  canPublish,
}: MintZoneTokenOpts): Promise<string> {
  const key = process.env.LIVEKIT_API_KEY
  const secret = process.env.LIVEKIT_API_SECRET
  if (!key || !secret) {
    throw new Error(
      "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set (see apps/rtc/.example.env)",
    )
  }

  const at = new AccessToken(key, secret, { identity, ttl: "10m" })
  at.addGrant({
    roomJoin: true,
    room: zoneId,
    canPublish,
    canSubscribe: true,
  })
  return at.toJwt()
}
