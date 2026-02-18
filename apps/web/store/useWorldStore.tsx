import { create } from "zustand"

type Zone = "meeting" | "project" | "social" | null

type WorldState = {
  position: { x: number; y: number }
  setPosition: (x: number, y: number) => void
  currentZone: Zone
  setZone: (zone: Zone) => void
}

export const useWorldStore = create<WorldState>((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (x, y) => set({ position: { x, y } }),
  currentZone: null,
  setZone: (zone) => set({ currentZone: zone }),
}))
