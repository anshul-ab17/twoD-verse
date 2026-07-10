// Typed client for /v1/verses (spec §4.5).
import { GATEWAY, getAccessToken } from "./auth"

export type Verse = {
  id: string
  hash: string
  name: string
  template: string
  memberCount: number
  onlineCount: number
  role: string
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      authorization: `Bearer ${getAccessToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const msg = await res.json().then((j) => (j as { error?: string }).error).catch(() => null)
    throw new Error(msg ?? `request failed (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export const listVerses = () => api<{ verses: Verse[] }>("GET", "/v1/verses").then((d) => d.verses)

export const createVerse = (name: string, template: string) =>
  api<{ id: string; hash: string }>("POST", "/v1/verses", { name, template })

export const renameVerse = (id: string, name: string) => api<void>("PATCH", `/v1/verses/${id}`, { name })

export const deleteVerse = (id: string) => api<void>("DELETE", `/v1/verses/${id}`)

export const createInvite = (id: string) =>
  api<{ inviteId: string }>("POST", `/v1/verses/${id}/invite`).then((d) => d.inviteId)

export const acceptInvite = (inviteId: string) =>
  api<{ verse: { hash: string } }>("POST", `/v1/verses/invites/${inviteId}/accept`).then((d) => d.verse)
