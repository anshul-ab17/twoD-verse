"use client"

import { useCallback, useEffect, useState } from "react"

export type ThemeKey = "woody" | "neon" | "forest" | "corporate" | "midnight"

export type ThemeConfig = {
  key: ThemeKey
  label: string
  icon: string
  phaserBg: string
  containerBorder: string
  containerBg: string
  controlBg: string
  controlBorder: string
  btnBg: string
  btnBorder: string
  btnText: string
  btnHover: string
  activeBg: string
  activeBorder: string
  activeText: string
  chatBg: string
  chatBorder: string
  chatMsgBg: string
  chatMsgMineBg: string
  statusBg: string
}

export const THEMES: Record<ThemeKey, ThemeConfig> = {
  woody: {
    key: "woody",
    label: "Woody",
    icon: "🪵",
    phaserBg: "#1e1e1e",
    containerBorder: "#3f2a17",
    containerBg: "#0b0f19",
    controlBg: "#160f0a",
    controlBorder: "#6b4b2a",
    btnBg: "#2a1b11",
    btnBorder: "#6b4b2a",
    btnText: "#fef3c7",
    btnHover: "#3a2518",
    activeBg: "#556b2f",
    activeBorder: "#4d6f29",
    activeText: "#f0fdf4",
    chatBg: "#1f140c",
    chatBorder: "#6b4b2a",
    chatMsgBg: "#2a1b11",
    chatMsgMineBg: "#556b2f",
    statusBg: "#1e0f08",
  },
  neon: {
    key: "neon",
    label: "Neon",
    icon: "⚡",
    phaserBg: "#0a0015",
    containerBorder: "#5b21b6",
    containerBg: "#070010",
    controlBg: "#0d0020",
    controlBorder: "#7c3aed",
    btnBg: "#1a0a2e",
    btnBorder: "#6d28d9",
    btnText: "#e9d5ff",
    btnHover: "#2d1254",
    activeBg: "#7c3aed",
    activeBorder: "#8b5cf6",
    activeText: "#f5f3ff",
    chatBg: "#0f0825",
    chatBorder: "#7c3aed",
    chatMsgBg: "#1a0d2e",
    chatMsgMineBg: "#5b21b6",
    statusBg: "#0a0020",
  },
  forest: {
    key: "forest",
    label: "Forest",
    icon: "🌿",
    phaserBg: "#0a1a0a",
    containerBorder: "#14532d",
    containerBg: "#040d04",
    controlBg: "#0a1a08",
    controlBorder: "#166534",
    btnBg: "#0f2a0e",
    btnBorder: "#166534",
    btnText: "#bbf7d0",
    btnHover: "#163d15",
    activeBg: "#15803d",
    activeBorder: "#16a34a",
    activeText: "#f0fdf4",
    chatBg: "#0f2010",
    chatBorder: "#166534",
    chatMsgBg: "#0f2a0e",
    chatMsgMineBg: "#15803d",
    statusBg: "#071408",
  },
  corporate: {
    key: "corporate",
    label: "Corporate",
    icon: "🏢",
    phaserBg: "#0f1520",
    containerBorder: "#1e3a5f",
    containerBg: "#0a0f1a",
    controlBg: "#0f1824",
    controlBorder: "#1d4ed8",
    btnBg: "#0f1e38",
    btnBorder: "#1d4ed8",
    btnText: "#bfdbfe",
    btnHover: "#162847",
    activeBg: "#1d4ed8",
    activeBorder: "#2563eb",
    activeText: "#eff6ff",
    chatBg: "#0a1428",
    chatBorder: "#1d4ed8",
    chatMsgBg: "#0f1e38",
    chatMsgMineBg: "#1d4ed8",
    statusBg: "#080e1c",
  },
  midnight: {
    key: "midnight",
    label: "Midnight",
    icon: "🌙",
    phaserBg: "#08080f",
    containerBorder: "#312e81",
    containerBg: "#020208",
    controlBg: "#060610",
    controlBorder: "#4338ca",
    btnBg: "#0e0e20",
    btnBorder: "#4338ca",
    btnText: "#c7d2fe",
    btnHover: "#16163a",
    activeBg: "#4338ca",
    activeBorder: "#4f46e5",
    activeText: "#eef2ff",
    chatBg: "#0a0a1e",
    chatBorder: "#4338ca",
    chatMsgBg: "#0e0e20",
    chatMsgMineBg: "#4338ca",
    statusBg: "#04040c",
  },
}

const STORAGE_KEY = "twodverse:theme"

function readTheme(): ThemeKey {
  if (typeof window === "undefined") return "woody"
  const raw = localStorage.getItem(STORAGE_KEY)
  return (raw && raw in THEMES ? raw : "woody") as ThemeKey
}

export function useTheme() {
  const [themeKey, setThemeKey] = useState<ThemeKey>("woody")

  useEffect(() => {
    setThemeKey(readTheme())
  }, [])

  const setTheme = useCallback((key: ThemeKey) => {
    localStorage.setItem(STORAGE_KEY, key)
    setThemeKey(key)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("twodverse:set-theme", { detail: { theme: key } })
      )
    }
  }, [])

  return { themeKey, theme: THEMES[themeKey], setTheme }
}
