import { CHAR_KEYS } from "./constants"
import type { CharKey } from "./types"

export function idleAnimKey(char: CharKey): string {
  return `${char}-idle`
}

export function runAnimKey(char: CharKey): string {
  return `${char}-run`
}

/** Deterministically assigns a character to a remote player based on their userId. */
export function charForUserId(userId: string): CharKey {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
  }
  return CHAR_KEYS[Math.abs(hash) % CHAR_KEYS.length]
}
