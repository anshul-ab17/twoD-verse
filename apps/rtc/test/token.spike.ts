// Spike self-check: mintZoneToken emits a JWT with room=zoneId + expected
// grants. No network — dummy creds set in-process. `bun run test/token.spike.ts`
import { mintZoneToken } from "../src/token"

process.env.LIVEKIT_API_KEY = "devkey"
process.env.LIVEKIT_API_SECRET = "devsecret-devsecret-devsecret-32"

const token = await mintZoneToken({
  identity: "player-1",
  zoneId: "voice-lounge",
  canPublish: true,
})

const [, payloadB64] = token.split(".")
if (!payloadB64) throw new Error(`not a JWT: ${token}`)
const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")))

console.assert(payload.sub === "player-1", `sub wrong: ${payload.sub}`)
console.assert(payload.video?.room === "voice-lounge", `room wrong: ${JSON.stringify(payload.video)}`)
console.assert(payload.video?.roomJoin === true, "roomJoin missing")
console.assert(payload.video?.canPublish === true, "canPublish wrong")
console.assert(payload.video?.canSubscribe === true, "canSubscribe missing")

// TTL ~10m
const ttl = payload.exp - (payload.nbf ?? payload.iat)
console.assert(ttl > 9 * 60 && ttl <= 10 * 60 + 5, `ttl wrong: ${ttl}s`)

console.log("token spike ok")
