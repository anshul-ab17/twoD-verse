import { Room, type Client } from "@colyseus/core"
import {
  WorldRoomState,
  PlayerState,
  TICK_RATE,
  MOVE_SPEED,
  WORLD,
  MSG,
  SPIKE_ZONES,
  zoneAt,
  type MoveInput,
} from "@verse/net-schema"

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export class WorldRoom extends Room<WorldRoomState> {
  override maxClients = 100

  /** latest input per session, applied every tick until replaced */
  private inputs = new Map<string, MoveInput>()

  // ponytail: JWT skipped for spike — add onAuth() here calling
  // @verse/auth verifyAccessToken(options.token) and reject on failure.

  override onCreate() {
    this.setState(new WorldRoomState())

    this.onMessage(MSG.MOVE, (client, input: MoveInput) => {
      // trust boundary: clamp direction to unit range, drop NaN
      const dx = clamp(Number(input?.dx) || 0, -1, 1)
      const dy = clamp(Number(input?.dy) || 0, -1, 1)
      this.inputs.set(client.sessionId, { dx, dy })
    })

    this.setSimulationInterval((dtMs) => this.tick(dtMs), 1000 / TICK_RATE)
  }

  override onJoin(client: Client) {
    const player = new PlayerState()
    player.id = client.sessionId
    player.x = WORLD.width / 2
    player.y = WORLD.height / 2
    this.state.players.set(client.sessionId, player)
  }

  override onLeave(client: Client) {
    this.state.players.delete(client.sessionId)
    this.inputs.delete(client.sessionId)
  }

  /** Authoritative movement: server integrates position, never trusts client x/y. */
  private tick(dtMs: number) {
    const dt = dtMs / 1000
    for (const [sessionId, player] of this.state.players) {
      const input = this.inputs.get(sessionId)
      if (!input || (input.dx === 0 && input.dy === 0)) continue

      // ponytail: zone check only when moving — stationary players can't change zones.

      // normalize so diagonals aren't faster (speed clamp)
      const len = Math.hypot(input.dx, input.dy)
      const nx = input.dx / len
      const ny = input.dy / len

      player.x = clamp(player.x + nx * MOVE_SPEED * dt, 0, WORLD.width)
      player.y = clamp(player.y + ny * MOVE_SPEED * dt, 0, WORLD.height)
      player.dir =
        Math.abs(nx) > Math.abs(ny) ? (nx > 0 ? "right" : "left") : ny > 0 ? "down" : "up"

      // zone -> media mapping (plan §6): LiveKit room = zoneId.
      // ponytail: client watches its own zoneId, POSTs apps/media /token and
      // joins/leaves the LiveKit room — client side not built in this spike.
      const zoneId = zoneAt(SPIKE_ZONES, player.x, player.y)?.id ?? ""
      if (player.zoneId !== zoneId) player.zoneId = zoneId
    }
  }

  // ponytail: AOI via StateView, add when room >20 players — full state
  // broadcast is fine for the spike.
}
