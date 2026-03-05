"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { apiFetch, ApiError } from "@/lib/api"

type SessionStatus = "loading" | "authenticated" | "unauthenticated"

export type SessionUser = {
  id: string
  email: string
  role: string
  name: string
  avatarUrl?: string
}

type MeResponse = {
  id: string
  email: string
  role: string
  avatar?: {
    imageUrl?: string | null
  } | null
}

type AuthSessionContextValue = {
  status: SessionStatus
  user: SessionUser | null
  refreshSession: () => Promise<SessionUser | null>
  signOut: () => Promise<void>
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null)

function deriveNameFromEmail(email: string) {
  const prefix = email.split("@")[0] || "User"
  return prefix.slice(0, 1).toUpperCase() + prefix.slice(1)
}

function toSessionUser(user: MeResponse): SessionUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: deriveNameFromEmail(user.email),
    avatarUrl: user.avatar?.imageUrl || undefined,
  }
}

function writeCurrentUserToStorage(user: SessionUser | null) {
  if (typeof window === "undefined") return

  if (!user) {
    localStorage.removeItem("currentUser")
    return
  }

  localStorage.setItem(
    "currentUser",
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    })
  )
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [status, setStatus] = useState<SessionStatus>("loading")
  const [user, setUser] = useState<SessionUser | null>(null)

  const refreshSession = useCallback(async () => {
    try {
      const me = await apiFetch<MeResponse>("/api/auth/me")
      const normalized = toSessionUser(me)
      setUser(normalized)
      setStatus("authenticated")
      writeCurrentUserToStorage(normalized)
      return normalized
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null)
        setStatus("unauthenticated")
        writeCurrentUserToStorage(null)
        return null
      }
      console.error("Session refresh failed", error)
      setUser(null)
      setStatus("unauthenticated")
      writeCurrentUserToStorage(null)
      return null
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
      })
    } catch {
      // local session cleanup still applies
    } finally {
      setUser(null)
      setStatus("unauthenticated")
      writeCurrentUserToStorage(null)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      status,
      user,
      refreshSession,
      signOut,
    }),
    [refreshSession, signOut, status, user]
  )

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  )
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider")
  }

  return context
}
