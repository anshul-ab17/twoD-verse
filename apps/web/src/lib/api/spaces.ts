import { apiFetch } from "./client"

export type Space = {
  id: string
  name: string
  width: number
  height: number
  creatorId: string
  creator?: { id: string; email: string }
}

export async function listSpaces(): Promise<Space[]> {
  return apiFetch<Space[]>("/api/spaces")
}

export async function createSpace(name: string): Promise<Space> {
  return apiFetch<Space>("/api/spaces", {
    method: "POST",
    body: JSON.stringify({ name, width: 1600, height: 800 }),
  })
}

export async function renameSpace(id: string, name: string): Promise<void> {
  await apiFetch(`/api/spaces/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  })
}

export async function deleteSpace(id: string): Promise<void> {
  await apiFetch(`/api/spaces/${id}`, { method: "DELETE" })
}
