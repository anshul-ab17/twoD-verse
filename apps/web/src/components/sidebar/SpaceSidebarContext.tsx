"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { getGeneratedAvatarDataUrl } from "./avatar"

type PaneMode = "map" | "chat" | "search" | "notifications" | "spotify" | "friends"

export type SpaceUser = {
  id: string
  name: string
  email?: string
  avatarUrl?: string
}

type StoredSpace = {
  id?: unknown
  members?: unknown
}

type JoinNotification = {
  id: string
  createdAt: number
  message: string
  unread: boolean
  userId: string
}

export type SpaceChatMessage = {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string | null
  text: string
  createdAt: number
}

type SpaceSidebarContextValue = {
  spaceId: string
  activePane: PaneMode
  activatePane: (pane: PaneMode) => void
  currentUser: SpaceUser | null
  members: SpaceUser[]
  searchQuery: string
  setSearchQuery: (value: string) => void
  filteredMembers: SpaceUser[]
  notifications: JoinNotification[]
  unreadNotificationCount: number
  markNotificationsRead: () => void
  currentChatUserId: string | null
  currentChatUser: SpaceUser | null
  openChatWithUser: (userId: string | null) => void
  messages: SpaceChatMessage[]
  threadMessages: SpaceChatMessage[]
  sendMessage: (text: string) => void
  friends: SpaceUser[]
  addFriend: (user: SpaceUser) => void
  removeFriend: (userId: string) => void
  isFriend: (userId: string) => boolean
}

const SpaceSidebarContext = createContext<SpaceSidebarContextValue | null>(null)

function deriveNameFromEmail(email: string) {
  const prefix = email.split("@")[0] || "User"
  return prefix.slice(0, 1).toUpperCase() + prefix.slice(1)
}

function toSpaceUser(value: unknown): SpaceUser | null {
  if (!value || typeof value !== "object") return null
  const c = value as Record<string, unknown>
  const nested = c.user && typeof c.user === "object" ? (c.user as Record<string, unknown>) : null
  const id = c.id ?? c.userId ?? nested?.id ?? nested?.userId
  const name = c.name ?? c.userName ?? c.username ?? c.displayName ?? nested?.name ?? nested?.userName ?? nested?.username ?? nested?.displayName
  const email = c.email ?? nested?.email
  if (!id) return null
  const resolvedName = name ? String(name) : (email ? deriveNameFromEmail(String(email)) : null)
  if (!resolvedName) return null
  const avatar = c.avatarUrl ?? c.avatar ?? c.image ?? c.photo ?? c.picture ?? nested?.avatarUrl ?? nested?.avatar ?? nested?.image
  return {
    id: String(id),
    name: resolvedName,
    email: email ? String(email) : undefined,
    avatarUrl: typeof avatar === "string" && avatar.trim().length > 0
      ? avatar
      : getGeneratedAvatarDataUrl(resolvedName, String(id)),
  }
}

function readCurrentUser(): SpaceUser | null {
  if (typeof window === "undefined") return null
  try { return toSpaceUser(JSON.parse(localStorage.getItem("currentUser") || "null")) } catch { return null }
}

function getSpacesFromStorage(): StoredSpace[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem("spaces") || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

function getMembersForSpace(spaceId: string): SpaceUser[] {
  const spaces = getSpacesFromStorage()
  const found = spaces.find((s) => s?.id === spaceId)
  if (!found || !Array.isArray(found.members)) return []
  return (found.members as unknown[]).map(toSpaceUser).filter((u): u is SpaceUser => Boolean(u))
}

function ensureCurrentUserJoined(spaceId: string, user: SpaceUser | null) {
  if (!user) return
  const spaces = getSpacesFromStorage()
  const idx = spaces.findIndex((s) => s?.id === spaceId)
  if (idx < 0) return
  const members = Array.isArray(spaces[idx].members) ? spaces[idx].members as unknown[] : []
  if ((members as unknown[]).map(toSpaceUser).some((m) => m?.id === user.id)) return
  spaces[idx].members = [...members, user]
  localStorage.setItem("spaces", JSON.stringify(spaces))
}

function getChatKey(spaceId: string) { return `space-chat:${spaceId}` }

function readMessages(spaceId: string): SpaceChatMessage[] {
  if (typeof window === "undefined" || !spaceId) return []
  try {
    const raw = JSON.parse(localStorage.getItem(getChatKey(spaceId)) || "[]")
    if (!Array.isArray(raw)) return []
    return raw
      .filter((e) => e?.id && e?.fromUserId && typeof e.text === "string")
      .map((e) => ({
        id: String(e.id),
        fromUserId: String(e.fromUserId),
        fromUserName: String(e.fromUserName || "User"),
        toUserId: e.toUserId ? String(e.toUserId) : null,
        text: String(e.text),
        createdAt: Number(e.createdAt || Date.now()),
      }))
      .sort((a, b) => a.createdAt - b.createdAt)
  } catch { return [] }
}

function persistMessages(spaceId: string, messages: SpaceChatMessage[]) {
  if (typeof window === "undefined" || !spaceId) return
  localStorage.setItem(getChatKey(spaceId), JSON.stringify(messages))
}

export function SpaceSidebarProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ spaceId?: string }>()
  const spaceId = typeof params?.spaceId === "string" ? params.spaceId : ""

  const [activePane, setActivePane] = useState<PaneMode>("map")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<SpaceUser | null>(null)
  const [members, setMembers] = useState<SpaceUser[]>([])
  const [livePresenceUserIds, setLivePresenceUserIds] = useState<string[]>([])
  const [hasLivePresenceSnapshot, setHasLivePresenceSnapshot] = useState(false)
  const [notifications, setNotifications] = useState<JoinNotification[]>([])
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SpaceChatMessage[]>([])
  const [friends, setFriends] = useState<SpaceUser[]>([])
  // Map of userId → SpaceUser resolved from server (for users not in localStorage)
  const [knownUsersMap, setKnownUsersMap] = useState<Map<string, SpaceUser>>(new Map())

  const lastChatUserIdRef = useRef<string | null>(null)
  const previousMemberIdsRef = useRef<Set<string>>(new Set())
  const currentUserRef = useRef<SpaceUser | null>(null)
  const resolvedMembersRef = useRef<SpaceUser[]>([])

  // Friends
  const loadFriends = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      const raw = JSON.parse(localStorage.getItem("twodverse:friends") || "[]")
      if (!Array.isArray(raw)) return
      setFriends(raw.map((u: unknown) => toSpaceUser(u)).filter((u): u is SpaceUser => u !== null))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadFriends() }, [loadFriends])

  const addFriend = useCallback((user: SpaceUser) => {
    setFriends((prev) => {
      if (prev.some((f) => f.id === user.id)) return prev
      const next = [...prev, user]
      localStorage.setItem("twodverse:friends", JSON.stringify(next))
      return next
    })
  }, [])

  const removeFriend = useCallback((userId: string) => {
    setFriends((prev) => {
      const next = prev.filter((f) => f.id !== userId)
      localStorage.setItem("twodverse:friends", JSON.stringify(next))
      return next
    })
  }, [])

  const isFriend = useCallback((userId: string) => friends.some((f) => f.id === userId), [friends])

  // Space data from localStorage
  const refreshSpaceData = useCallback(() => {
    if (!spaceId) return
    const user = readCurrentUser()
    setCurrentUser(user)
    currentUserRef.current = user
    ensureCurrentUserJoined(spaceId, user)
    const nextMembers = getMembersForSpace(spaceId)
    const nextMemberIds = new Set(nextMembers.map((m) => m.id))
    if (previousMemberIdsRef.current.size > 0) {
      const joined = nextMembers.filter((m) => !previousMemberIdsRef.current.has(m.id) && m.id !== user?.id)
      if (joined.length > 0) {
        setNotifications((prev) => [
          ...joined.map((m) => ({
            id: crypto.randomUUID(), createdAt: Date.now(),
            message: `${m.name} joined this space`, unread: true, userId: m.id,
          })),
          ...prev,
        ].slice(0, 20))
      }
    }
    previousMemberIdsRef.current = nextMemberIds
    setMembers(nextMembers)
    if (!currentChatUserId && nextMembers.length > 0) {
      const fallback = nextMembers.find((m) => m.id !== user?.id) ?? nextMembers[0]
      if (fallback) { setCurrentChatUserId(fallback.id); lastChatUserIdRef.current = fallback.id }
    }
  }, [currentChatUserId, spaceId])

  useEffect(() => {
    if (!spaceId) return
    const sync = () => { refreshSpaceData(); setMessages(readMessages(spaceId)) }
    const t0 = window.setTimeout(sync, 0)
    const interval = window.setInterval(sync, 1500)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "spaces" || e.key === getChatKey(spaceId)) sync()
    }
    window.addEventListener("storage", onStorage)
    return () => { window.clearTimeout(t0); window.clearInterval(interval); window.removeEventListener("storage", onStorage) }
  }, [refreshSpaceData, spaceId])

  // Live presence
  useEffect(() => {
    if (!spaceId) return
    const handler = (event: Event) => {
      const userIds = ((event as CustomEvent<{ userIds?: string[] }>).detail?.userIds ?? [])
        .map(String).filter(Boolean)
      setHasLivePresenceSnapshot(true)
      setLivePresenceUserIds(userIds)
    }
    window.addEventListener("twodverse:presence:update", handler as EventListener)
    return () => {
      window.removeEventListener("twodverse:presence:update", handler as EventListener)
      setLivePresenceUserIds([])
      setHasLivePresenceSnapshot(false)
    }
  }, [spaceId])

  // Receive resolved member info from space page (via batch API)
  useEffect(() => {
    if (!spaceId) return
    const handler = (event: Event) => {
      const users = (event as CustomEvent<{ users: Array<{ id: string; email: string }> }>).detail?.users ?? []
      setKnownUsersMap((prev) => {
        const next = new Map(prev)
        for (const u of users) {
          if (!next.has(u.id)) {
            const name = deriveNameFromEmail(u.email)
            next.set(u.id, {
              id: u.id, name, email: u.email,
              avatarUrl: getGeneratedAvatarDataUrl(name, u.id),
            })
          }
        }
        return next
      })
    }
    window.addEventListener("twodverse:members:info", handler as EventListener)
    return () => window.removeEventListener("twodverse:members:info", handler as EventListener)
  }, [spaceId])

  // Incoming WS chat messages from other users
  useEffect(() => {
    if (!spaceId) return
    const handler = (event: Event) => {
      const { fromUserId, fromUserName, content } = (event as CustomEvent<{
        fromUserId: string; fromUserName: string; content: string
      }>).detail
      // Skip our own messages (already saved on send)
      if (fromUserId === currentUserRef.current?.id) return
      const msg: SpaceChatMessage = {
        id: crypto.randomUUID(),
        fromUserId,
        fromUserName,
        toUserId: null,
        text: content,
        createdAt: Date.now(),
      }
      setMessages((prev) => {
        const next = [...prev, msg]
        persistMessages(spaceId, next)
        return next
      })
    }
    window.addEventListener("twodverse:chat:incoming", handler as EventListener)
    return () => window.removeEventListener("twodverse:chat:incoming", handler as EventListener)
  }, [spaceId])

  const resolvedMembers = useMemo(() => {
    if (!hasLivePresenceSnapshot) return members
    const memberById = new Map(members.map((m) => [m.id, m]))
    const seen = new Set<string>()
    const result: SpaceUser[] = []
    for (const userId of livePresenceUserIds) {
      if (seen.has(userId)) continue
      seen.add(userId)
      // Priority: localStorage member > batch-resolved user > Guest fallback
      result.push(
        memberById.get(userId) ??
        knownUsersMap.get(userId) ??
        { id: userId, name: `Guest ${userId.slice(0, 6)}`, avatarUrl: getGeneratedAvatarDataUrl(`Guest ${userId.slice(0, 6)}`, userId) }
      )
    }
    return result
  }, [hasLivePresenceSnapshot, knownUsersMap, livePresenceUserIds, members])

  // Keep ref in sync for use in event handlers
  resolvedMembersRef.current = resolvedMembers

  const currentChatUser = useMemo(
    () => resolvedMembers.find((m) => m.id === currentChatUserId) ?? null,
    [currentChatUserId, resolvedMembers]
  )

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return resolvedMembers
    return resolvedMembers.filter((m) => m.name.toLowerCase().includes(q))
  }, [resolvedMembers, searchQuery])

  const threadMessages = useMemo(() => {
    if (!currentUser) return []
    if (!currentChatUserId) return messages.filter((m) => m.toUserId === null)
    return messages.filter((m) =>
      (m.fromUserId === currentUser.id && m.toUserId === currentChatUserId) ||
      (m.fromUserId === currentChatUserId && m.toUserId === currentUser.id)
    )
  }, [currentChatUserId, currentUser, messages])

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }, [])

  const activatePane = useCallback((pane: PaneMode) => {
    if (pane === "map") {
      if (activePane === "chat") { lastChatUserIdRef.current = currentChatUserId; setActivePane("map"); return }
      if (activePane === "map" && lastChatUserIdRef.current) { setCurrentChatUserId(lastChatUserIdRef.current); setActivePane("chat"); return }
      setActivePane("map"); return
    }
    if (pane === "chat" && !currentChatUserId) {
      const fallback = resolvedMembers.find((m) => m.id !== currentUser?.id) ?? resolvedMembers[0]
      if (fallback) { setCurrentChatUserId(fallback.id); lastChatUserIdRef.current = fallback.id }
    }
    if (pane === "notifications") markNotificationsRead()
    setActivePane(pane)
  }, [activePane, currentChatUserId, currentUser?.id, markNotificationsRead, resolvedMembers])

  const openChatWithUser = useCallback((userId: string | null) => {
    setCurrentChatUserId(userId); lastChatUserIdRef.current = userId; setActivePane("chat")
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (!spaceId || !currentUserRef.current) return
    const trimmed = text.trim()
    if (!trimmed) return
    const msg: SpaceChatMessage = {
      id: crypto.randomUUID(),
      fromUserId: currentUserRef.current.id,
      fromUserName: currentUserRef.current.name,
      toUserId: currentChatUserId,
      text: trimmed,
      createdAt: Date.now(),
    }
    // Save locally immediately (optimistic)
    setMessages((prev) => { const next = [...prev, msg]; persistMessages(spaceId, next); return next })
    // Send through WebSocket via event bridge (global chat only, not DMs)
    if (!currentChatUserId) {
      window.dispatchEvent(new CustomEvent("twodverse:chat:send", { detail: { content: trimmed } }))
    }
  }, [currentChatUserId, spaceId])

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => n.unread).length, [notifications]
  )

  const value = useMemo<SpaceSidebarContextValue>(() => ({
    spaceId, activePane, activatePane, currentUser, members: resolvedMembers,
    searchQuery, setSearchQuery, filteredMembers, notifications, unreadNotificationCount,
    markNotificationsRead, currentChatUserId, currentChatUser, openChatWithUser,
    messages, threadMessages, sendMessage, friends, addFriend, removeFriend, isFriend,
  }), [
    spaceId, activePane, activatePane, currentUser, resolvedMembers, searchQuery,
    filteredMembers, notifications, unreadNotificationCount, markNotificationsRead,
    currentChatUserId, currentChatUser, openChatWithUser, messages, threadMessages,
    sendMessage, friends, addFriend, removeFriend, isFriend,
  ])

  return <SpaceSidebarContext.Provider value={value}>{children}</SpaceSidebarContext.Provider>
}

export function useSpaceSidebar() {
  const context = useContext(SpaceSidebarContext)
  if (!context) throw new Error("useSpaceSidebar must be used inside SpaceSidebarProvider")
  return context
}
