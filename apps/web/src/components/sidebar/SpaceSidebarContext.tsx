"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { getGeneratedAvatarDataUrl } from "./avatar"

type PaneMode = "map" | "chat" | "search" | "notifications" | "spotify"

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
}

const SpaceSidebarContext = createContext<SpaceSidebarContextValue | null>(null)

function toSpaceUser(value: unknown): SpaceUser | null {
  if (!value || typeof value !== "object") return null

  const candidate = value as {
    id?: unknown
    userId?: unknown
    name?: unknown
    userName?: unknown
    username?: unknown
    displayName?: unknown
    email?: unknown
    avatarUrl?: unknown
    avatar?: unknown
    avatar_url?: unknown
    avatarURL?: unknown
    profileImage?: unknown
    profileImageUrl?: unknown
    profilePhoto?: unknown
    image?: unknown
    imageUrl?: unknown
    photo?: unknown
    photoUrl?: unknown
    photoURL?: unknown
    picture?: unknown
    user?: unknown
  }
  const nestedUser = candidate.user && typeof candidate.user === "object"
    ? (candidate.user as {
      id?: unknown
      userId?: unknown
      name?: unknown
      userName?: unknown
      username?: unknown
      displayName?: unknown
      email?: unknown
      avatarUrl?: unknown
      avatar?: unknown
      avatar_url?: unknown
      avatarURL?: unknown
      profileImage?: unknown
      profileImageUrl?: unknown
      profilePhoto?: unknown
      image?: unknown
      imageUrl?: unknown
      photo?: unknown
      photoUrl?: unknown
      photoURL?: unknown
      picture?: unknown
    })
    : null

  const idCandidate = candidate.id ?? candidate.userId ?? nestedUser?.id ?? nestedUser?.userId
  const nameCandidate =
    candidate.name ?? candidate.userName ?? candidate.username ?? candidate.displayName ??
    nestedUser?.name ?? nestedUser?.userName ?? nestedUser?.username ?? nestedUser?.displayName
  const emailCandidate = candidate.email ?? nestedUser?.email

  if (!idCandidate || !nameCandidate) return null

  const avatarCandidate =
    candidate.avatarUrl ??
    candidate.avatar ??
    candidate.avatar_url ??
    candidate.avatarURL ??
    candidate.profileImage ??
    candidate.profileImageUrl ??
    candidate.profilePhoto ??
    candidate.image ??
    candidate.imageUrl ??
    candidate.photo ??
    candidate.photoUrl ??
    candidate.photoURL ??
    candidate.picture ??
    nestedUser?.avatarUrl ??
    nestedUser?.avatar ??
    nestedUser?.avatar_url ??
    nestedUser?.avatarURL ??
    nestedUser?.profileImage ??
    nestedUser?.profileImageUrl ??
    nestedUser?.profilePhoto ??
    nestedUser?.image ??
    nestedUser?.imageUrl ??
    nestedUser?.photo ??
    nestedUser?.photoUrl ??
    nestedUser?.photoURL ??
    nestedUser?.picture

  return {
    id: String(idCandidate),
    name: String(nameCandidate),
    email: emailCandidate ? String(emailCandidate) : undefined,
    avatarUrl:
      typeof avatarCandidate === "string" && avatarCandidate.trim().length > 0
        ? avatarCandidate
        : getGeneratedAvatarDataUrl(String(nameCandidate), String(idCandidate)),
  }
}

function readCurrentUser(): SpaceUser | null {
  if (typeof window === "undefined") return null

  try {
    const parsed = JSON.parse(localStorage.getItem("currentUser") || "null")
    return toSpaceUser(parsed)
  } catch {
    return null
  }
}

function getSpacesFromStorage(): StoredSpace[] {
  if (typeof window === "undefined") return []

  try {
    const parsed = JSON.parse(localStorage.getItem("spaces") || "[]")
    return Array.isArray(parsed) ? (parsed as StoredSpace[]) : []
  } catch {
    return []
  }
}

function getMembersForSpace(spaceId: string): SpaceUser[] {
  const spaces = getSpacesFromStorage()
  const found = spaces.find((space) => space?.id === spaceId)
  if (!found || !Array.isArray(found.members)) return []

  return found.members
    .map((member) => toSpaceUser(member))
    .filter((member): member is SpaceUser => Boolean(member))
}

function ensureCurrentUserJoined(spaceId: string, user: SpaceUser | null) {
  if (!user) return

  const spaces = getSpacesFromStorage()
  const spaceIndex = spaces.findIndex((space) => space?.id === spaceId)
  if (spaceIndex < 0) return

  const members = Array.isArray(spaces[spaceIndex].members) ? spaces[spaceIndex].members : []
  const alreadyMember = members
    .map((member) => toSpaceUser(member))
    .some((member) => member?.id === user.id)
  if (alreadyMember) return

  spaces[spaceIndex].members = [...members, user]
  localStorage.setItem("spaces", JSON.stringify(spaces))
}

function getChatStorageKey(spaceId: string) {
  return `space-chat:${spaceId}`
}

function readMessages(spaceId: string): SpaceChatMessage[] {
  if (typeof window === "undefined" || !spaceId) return []

  try {
    const raw = JSON.parse(localStorage.getItem(getChatStorageKey(spaceId)) || "[]")
    if (!Array.isArray(raw)) return []

    return raw
      .filter((entry) => entry && entry.id && entry.fromUserId && typeof entry.text === "string")
      .map((entry) => ({
        id: String(entry.id),
        fromUserId: String(entry.fromUserId),
        fromUserName: String(entry.fromUserName || "User"),
        toUserId: entry.toUserId ? String(entry.toUserId) : null,
        text: String(entry.text),
        createdAt: Number(entry.createdAt || Date.now()),
      }))
      .sort((a, b) => a.createdAt - b.createdAt)
  } catch {
    return []
  }
}

function persistMessages(spaceId: string, messages: SpaceChatMessage[]) {
  if (typeof window === "undefined" || !spaceId) return
  localStorage.setItem(getChatStorageKey(spaceId), JSON.stringify(messages))
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
  const lastChatUserIdRef = useRef<string | null>(null)
  const previousMemberIdsRef = useRef<Set<string>>(new Set())

  const refreshSpaceData = useCallback(() => {
    if (!spaceId) return

    const user = readCurrentUser()
    setCurrentUser(user)
    ensureCurrentUserJoined(spaceId, user)

    const nextMembers = getMembersForSpace(spaceId)
    const nextMemberIds = new Set(nextMembers.map((member) => member.id))

    if (previousMemberIdsRef.current.size > 0) {
      const joinedMembers = nextMembers.filter((member) => !previousMemberIdsRef.current.has(member.id))
      if (joinedMembers.length > 0) {
        setNotifications((prev) => {
          const joined = joinedMembers
            .filter((member) => member.id !== user?.id)
            .map((member) => ({
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              message: `${member.name} joined this space`,
              unread: true,
              userId: member.id,
            }))

          return [...joined, ...prev].slice(0, 20)
        })
      }
    }

    previousMemberIdsRef.current = nextMemberIds
    setMembers(nextMembers)

    if (!currentChatUserId && nextMembers.length > 0) {
      const defaultChatUser = nextMembers.find((member) => member.id !== user?.id) ?? nextMembers[0]
      if (defaultChatUser) {
        setCurrentChatUserId(defaultChatUser.id)
        lastChatUserIdRef.current = defaultChatUser.id
      }
    }
  }, [currentChatUserId, spaceId])

  useEffect(() => {
    if (!spaceId) return

    const syncFromStorage = () => {
      refreshSpaceData()
      setMessages(readMessages(spaceId))
    }

    const initialSync = window.setTimeout(syncFromStorage, 0)
    const timer = window.setInterval(() => {
      syncFromStorage()
    }, 1500)

    const onStorage = (event: StorageEvent) => {
      if (event.key === "spaces" || event.key === getChatStorageKey(spaceId)) {
        syncFromStorage()
      }
    }

    window.addEventListener("storage", onStorage)
    return () => {
      window.clearTimeout(initialSync)
      window.clearInterval(timer)
      window.removeEventListener("storage", onStorage)
    }
  }, [refreshSpaceData, spaceId])

  useEffect(() => {
    if (!spaceId) return

    const handlePresenceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ userIds?: string[] }>
      const userIds = Array.isArray(customEvent.detail?.userIds)
        ? customEvent.detail.userIds
            .map((userId) => String(userId))
            .filter((userId) => userId.length > 0)
        : []

      setHasLivePresenceSnapshot(true)
      setLivePresenceUserIds(userIds)
    }

    window.addEventListener("twodverse:presence:update", handlePresenceUpdate as EventListener)
    return () => {
      window.removeEventListener("twodverse:presence:update", handlePresenceUpdate as EventListener)
      setLivePresenceUserIds([])
      setHasLivePresenceSnapshot(false)
    }
  }, [spaceId])

  const resolvedMembers = useMemo(() => {
    if (!hasLivePresenceSnapshot) return members

    const memberById = new Map(members.map((member) => [member.id, member]))
    const seen = new Set<string>()
    const onlineMembers: SpaceUser[] = []

    for (const userId of livePresenceUserIds) {
      if (seen.has(userId)) continue
      seen.add(userId)

      const existing = memberById.get(userId)
      if (existing) {
        onlineMembers.push(existing)
        continue
      }

      const shortId = userId.slice(0, 6)
      onlineMembers.push({
        id: userId,
        name: `Guest ${shortId}`,
        avatarUrl: getGeneratedAvatarDataUrl(`Guest ${shortId}`, userId),
      })
    }

    return onlineMembers
  }, [hasLivePresenceSnapshot, livePresenceUserIds, members])

  const currentChatUser = useMemo(
    () => resolvedMembers.find((member) => member.id === currentChatUserId) ?? null,
    [currentChatUserId, resolvedMembers]
  )

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return resolvedMembers
    return resolvedMembers.filter((member) => member.name.toLowerCase().includes(query))
  }, [resolvedMembers, searchQuery])

  const threadMessages = useMemo(() => {
    if (!currentUser) return []
    if (!currentChatUserId) return messages.filter((entry) => entry.toUserId === null)

    return messages.filter((entry) => {
      const sentToCurrent = entry.fromUserId === currentUser.id && entry.toUserId === currentChatUserId
      const receivedFromCurrent = entry.fromUserId === currentChatUserId && entry.toUserId === currentUser.id
      return sentToCurrent || receivedFromCurrent
    })
  }, [currentChatUserId, currentUser, messages])

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((entry) => ({ ...entry, unread: false })))
  }, [])

  const activatePane = useCallback(
    (pane: PaneMode) => {
      if (pane === "map") {
        if (activePane === "chat") {
          lastChatUserIdRef.current = currentChatUserId
          setActivePane("map")
          return
        }

        if (activePane === "map" && lastChatUserIdRef.current) {
          setCurrentChatUserId(lastChatUserIdRef.current)
          setActivePane("chat")
          return
        }

        setActivePane("map")
        return
      }

      if (pane === "chat" && !currentChatUserId) {
        const fallback = resolvedMembers.find((member) => member.id !== currentUser?.id) ?? resolvedMembers[0]
        if (fallback) {
          setCurrentChatUserId(fallback.id)
          lastChatUserIdRef.current = fallback.id
        }
      }

      if (pane === "notifications") {
        markNotificationsRead()
      }

      setActivePane(pane)
    },
    [activePane, currentChatUserId, currentUser?.id, markNotificationsRead, resolvedMembers]
  )

  const openChatWithUser = useCallback((userId: string | null) => {
    setCurrentChatUserId(userId)
    lastChatUserIdRef.current = userId
    setActivePane("chat")
  }, [])

  const sendMessage = useCallback(
    (text: string) => {
      if (!spaceId || !currentUser) return

      const trimmed = text.trim()
      if (!trimmed) return

      const nextMessage: SpaceChatMessage = {
        id: crypto.randomUUID(),
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        toUserId: currentChatUserId,
        text: trimmed,
        createdAt: Date.now(),
      }

      setMessages((prev) => {
        const next = [...prev, nextMessage]
        persistMessages(spaceId, next)
        return next
      })
    },
    [currentChatUserId, currentUser, spaceId]
  )

  const unreadNotificationCount = useMemo(
    () => notifications.filter((entry) => entry.unread).length,
    [notifications]
  )

  const value = useMemo<SpaceSidebarContextValue>(
    () => ({
      spaceId,
      activePane,
      activatePane,
      currentUser,
      members: resolvedMembers,
      searchQuery,
      setSearchQuery,
      filteredMembers,
      notifications,
      unreadNotificationCount,
      markNotificationsRead,
      currentChatUserId,
      currentChatUser,
      openChatWithUser,
      messages,
      threadMessages,
      sendMessage,
    }),
    [
      spaceId,
      activePane,
      activatePane,
      currentUser,
      resolvedMembers,
      searchQuery,
      filteredMembers,
      notifications,
      unreadNotificationCount,
      markNotificationsRead,
      currentChatUserId,
      currentChatUser,
      openChatWithUser,
      messages,
      threadMessages,
      sendMessage,
    ]
  )

  return <SpaceSidebarContext.Provider value={value}>{children}</SpaceSidebarContext.Provider>
}

export function useSpaceSidebar() {
  const context = useContext(SpaceSidebarContext)
  if (!context) {
    throw new Error("useSpaceSidebar must be used inside SpaceSidebarProvider")
  }

  return context
}
