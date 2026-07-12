import { apiFetch } from "./client"

export type SessionUser = {
  id: string
  email: string
  role: string
  avatar?: { imageUrl?: string | null } | null
}

export async function signin(email: string, password: string): Promise<void> {
  await apiFetch("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuthRetry: true,
  })
}

export async function me(): Promise<SessionUser> {
  return apiFetch<SessionUser>("/api/auth/me")
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" })
}
