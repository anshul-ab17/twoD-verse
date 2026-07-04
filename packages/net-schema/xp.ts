// XP economy constants + level curve (plan §3, §16). Pure — shared client/server,
// but only the server ever AWARDS xp (client can never grant itself xp).

export const XP_AWARDS = {
  DAILY_LOGIN: 50,
  CHAT_MESSAGE: 2,
  ZONE_ENTER: 10,
} as const

/** daily cap on xp earned from chat messages */
export const CHAT_XP_DAILY_CAP = 100

/** level = floor(sqrt(xp/100)) + 1 — level 1 at 0 xp, monotonic */
export function levelForXp(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}

/** minimum xp needed to be the given level (inverse of levelForXp) */
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 100
}
