import { Room, type Client } from "@colyseus/core"
import {
  WorldRoomState,
  PlayerState,
  TICK_RATE,
  MOVE_SPEED,
  WORLD,
  MSG,
  CHAT_BROADCAST,
  CHAT_MAX_LEN,
  SPIKE_ZONES,
  zoneAt,
  XP_AWARDS,
  CHAT_XP_DAILY_CAP,
  QUESTS,
  FOCUS_MINUTES,
  FOCUS_XP,
  LEVEL_UP,
  levelForXp,
  type ChatBroadcast,
  type ChatInput,
  type MoveInput,
  type LevelUpBroadcast,
} from "@repo/net-schema"
// subpath import: token.service only — index.ts drags in prisma/argon2 the realtime server doesn't need
import { verifyToken } from "@repo/auth/token.service"
import { client as db } from "@repo/db"
import { redis, connectRedis, allow } from "@repo/pubsub"

// Soft moderation filter (plan §16): matched words masked, message still sent.
// ponytail: static list + masking — AI auto-mod (Haiku classifier) is the plan
// §13 upgrade; list deliberately short until then.
const BLOCKLIST = ["slur1", "slur2", "badword"]
const BLOCK_RE = new RegExp(`\\b(${BLOCKLIST.join("|")})\\b`, "gi")
const moderate = (text: string) => text.replace(BLOCK_RE, (m) => "*".repeat(m.length))

// Presence (plan §7/§15): sorted set presence:{worldId}, score = last-seen ms.
// ponytail: worldId hardcoded "world" — single room type for now.
// ponytail: no TTL sweep — a crashed node leaves stale members; readers filter
// by score age (90s window), add a periodic ZREMRANGEBYSCORE sweep when the
// set's size matters.
const PRESENCE_KEY = "presence:world"
const PRESENCE_REFRESH_MS = 60_000

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export class WorldRoom extends Room<WorldRoomState> {
  override maxClients = 100

  /** latest input per session, applied every tick until replaced */
  private inputs = new Map<string, MoveInput>()

  /** per-session last chat timestamp for rate limiting */
  private lastChat = new Map<string, number>()

  /** per-session xp earned from chat (plan §3 daily cap). ponytail: in-memory,
   * resets on rejoin — Redis counter for a true cross-shard daily cap. */
  private chatXp = new Map<string, number>()

  /** per-session zones already awarded ZONE_ENTER */
  private zonesEntered = new Map<string, Set<string>>()

  /** per-session last persisted focus date (yyyy-mm-dd or null), for the streak */
  private lastFocus = new Map<string, string | null>()

  /** Plan §6: every join carries an access JWT; result lands on client.auth. */
  override onAuth(client: Client, options?: { token?: string }) {
    if (!options?.token) {
      // ponytail: AUTH_OPTIONAL=1 for tokenless dev/spike joins — never set in prod
      if (process.env.AUTH_OPTIONAL === "1") return { userId: `guest-${client.sessionId}`, guest: true }
      throw new Error("unauthorized: token required")
    }
    let payload: { userId?: string; jti?: string }
    try {
      payload = verifyToken(options.token)
    } catch {
      throw new Error("unauthorized: invalid token")
    }
    // refresh tokens carry a jti — only access tokens may join (mirrors gateway /v1/me)
    if (!payload?.userId || payload.jti) throw new Error("unauthorized: invalid token")
    return { userId: payload.userId }
  }

  override onCreate() {
    this.setState(new WorldRoomState())

    this.onMessage(MSG.MOVE, (client, input: MoveInput) => {
      // trust boundary: clamp direction to unit range, drop NaN
      const dx = clamp(Number(input?.dx) || 0, -1, 1)
      const dy = clamp(Number(input?.dy) || 0, -1, 1)
      this.inputs.set(client.sessionId, { dx, dy })
    })

    this.onMessage(MSG.CHAT, async (client, input: ChatInput) => {
      // trust boundary: coerce, trim, cap; reject empty
      const raw = String(input?.text ?? "").trim().slice(0, CHAT_MAX_LEN)
      if (!raw) return
      const player = this.state.players.get(client.sessionId)
      if (!player) return
      // Redis sliding window (3 msg/s per user, cross-shard); in-memory 500ms
      // gap kept as the fallback when redis is down (degrade-open in dev, §16)
      const now = Date.now()
      try {
        if (!(await allow(player.id, "chat"))) return
      } catch {
        if (now - (this.lastChat.get(client.sessionId) ?? 0) < 500) return
      }
      this.lastChat.set(client.sessionId, now)
      const text = moderate(raw)
      const msg: ChatBroadcast = { from: client.sessionId, text, ts: now }
      this.broadcast(CHAT_BROADCAST, msg)

      // persist (plan §7) — fire-and-forget, guests skipped
      if (!player.id.startsWith("guest-")) {
        db.worldMessage.create({ data: { userId: player.id, text } }).catch(console.error)
      }

      // xp for accepted chat, capped per session (plan §3, §16)
      const earned = this.chatXp.get(client.sessionId) ?? 0
      if (earned < CHAT_XP_DAILY_CAP) {
        this.chatXp.set(client.sessionId, earned + XP_AWARDS.CHAT_MESSAGE)
        this.awardXp(client.sessionId, XP_AWARDS.CHAT_MESSAGE)
      }
      this.advanceQuest(client.sessionId, "say-hello")
    })

    this.setSimulationInterval((dtMs) => this.tick(dtMs), 1000 / TICK_RATE)

    // refresh presence scores so entries survive the 90s liveness window
    // (this.clock interval is auto-cleared on room dispose)
    this.clock.setInterval(() => {
      const ids = [...this.state.players.values()]
        .map((p) => p.id)
        .filter((id) => !id.startsWith("guest-"))
      if (!ids.length) return
      const now = Date.now()
      redis
        .zAdd(PRESENCE_KEY, ids.map((id) => ({ score: now, value: id })))
        .catch(console.error)
    }, PRESENCE_REFRESH_MS)
  }

  override async onJoin(client: Client) {
    const auth = client.auth as { userId: string; guest?: boolean }
    const player = new PlayerState()
    // label = JWT identity from onAuth; sessionId stays the map key
    player.id = auth.userId
    player.x = WORLD.width / 2
    player.y = WORLD.height / 2
    this.state.players.set(client.sessionId, player)

    if (auth.guest) return // guests have no DB row, no xp, no presence

    // presence: mark online (fire-and-forget, redis down must not block joins)
    connectRedis()
      .then(() => redis.zAdd(PRESENCE_KEY, { score: Date.now(), value: auth.userId }))
      .catch(console.error)

    // load persisted xp/level; daily login reward if lastDailyAt isn't today (UTC)
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { xp: true, level: true, lastDailyAt: true, questStep: true, focusStreak: true, lastFocusAt: true },
    })
    if (!user) return
    player.xp = user.xp
    player.level = user.level
    player.questStep = user.questStep
    player.streak = user.focusStreak
    this.lastFocus.set(client.sessionId, user.lastFocusAt?.toISOString().slice(0, 10) ?? null)
    const today = new Date().toISOString().slice(0, 10)
    if (user.lastDailyAt?.toISOString().slice(0, 10) !== today) {
      db.user
        .update({ where: { id: auth.userId }, data: { lastDailyAt: new Date() } })
        .catch(console.error)
      this.awardXp(client.sessionId, XP_AWARDS.DAILY_LOGIN)
    }

    // focus streak (plan §3): FOCUS_MINUTES continuously in the world -> today's
    // focus counts; consecutive days build the streak. Timer dies with the
    // session — leaving early forfeits today's progress (that's the mechanic).
    // FOCUS_TEST_MS shortens the window for spikes/dev only.
    const focusMs = Number(process.env.FOCUS_TEST_MS) || FOCUS_MINUTES * 60_000
    this.clock.setTimeout(() => this.grantFocus(client.sessionId), focusMs)
  }

  /** Called once per session after the focus window elapses. */
  private grantFocus(sessionId: string) {
    const player = this.state.players.get(sessionId)
    if (!player || player.id.startsWith("guest-")) return
    const today = new Date().toISOString().slice(0, 10)
    const last = this.lastFocus.get(sessionId)
    if (last === today) return // already counted today
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    player.streak = last === yesterday ? player.streak + 1 : 1
    this.lastFocus.set(sessionId, today)
    db.user
      .update({
        where: { id: player.id },
        data: { focusStreak: player.streak, lastFocusAt: new Date() },
      })
      .catch(console.error)
    this.awardXp(sessionId, FOCUS_XP)
  }

  /** Advance the linear quest chain iff `questId` is the player's next quest. */
  private advanceQuest(sessionId: string, questId: (typeof QUESTS)[number]["id"]) {
    const player = this.state.players.get(sessionId)
    if (!player || player.id.startsWith("guest-")) return
    const next = QUESTS[player.questStep]
    if (!next || next.id !== questId) return
    player.questStep += 1
    db.user
      .update({ where: { id: player.id }, data: { questStep: player.questStep } })
      .catch(console.error)
    this.awardXp(sessionId, next.xp)
  }

  override onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId)
    if (player && !player.id.startsWith("guest-")) {
      redis.zRem(PRESENCE_KEY, player.id).catch(console.error)
    }
    this.state.players.delete(client.sessionId)
    this.inputs.delete(client.sessionId)
    this.lastChat.delete(client.sessionId)
    this.chatXp.delete(client.sessionId)
    this.zonesEntered.delete(client.sessionId)
    this.lastFocus.delete(client.sessionId)
  }

  /** Server-authoritative xp (plan §16): only this room ever grants xp.
   * Persists on every award — ponytail: batch/debounce writes when award volume matters. */
  private awardXp(sessionId: string, amount: number) {
    const player = this.state.players.get(sessionId)
    if (!player || player.id.startsWith("guest-")) return
    player.xp += amount
    const level = levelForXp(player.xp)
    if (level > player.level) {
      player.level = level
      const msg: LevelUpBroadcast = { sessionId, level }
      this.broadcast(LEVEL_UP, msg)
    }
    // fire-and-forget flush; absolute values, server state is the source of truth
    db.user
      .update({ where: { id: player.id }, data: { xp: player.xp, level: player.level } })
      .catch(console.error)
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
      if (player.zoneId !== zoneId) {
        player.zoneId = zoneId
        if (zoneId) {
          // ZONE_ENTER once per zone per session (plan §3)
          let seen = this.zonesEntered.get(sessionId)
          if (!seen) this.zonesEntered.set(sessionId, (seen = new Set()))
          if (!seen.has(zoneId)) {
            seen.add(zoneId)
            this.awardXp(sessionId, XP_AWARDS.ZONE_ENTER)
          }
          if (zoneId === "voice-lounge") this.advanceQuest(sessionId, "visit-lounge")
          if (zoneId === "meeting-room") this.advanceQuest(sessionId, "hold-meeting")
        }
      }
    }
  }

  // ponytail: AOI via StateView, add when room >20 players — full state
  // broadcast is fine for the spike.
}
