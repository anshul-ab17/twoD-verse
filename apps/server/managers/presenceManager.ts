const presence = new Map<string, Set<string>>()

export function addUser(spaceId: string, userId: string) {
  if (!presence.has(spaceId)) {
    presence.set(spaceId, new Set())
  }
  presence.get(spaceId)!.add(userId)
}

export function removeUser(spaceId: string, userId: string) {
  presence.get(spaceId)?.delete(userId)
}

export function getUsers(spaceId: string) {
  return Array.from(presence.get(spaceId) ?? [])
}
