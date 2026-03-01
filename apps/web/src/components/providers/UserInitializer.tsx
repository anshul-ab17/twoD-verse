"use client"

import { useEffect } from "react"

export default function UserInitializer() {
  useEffect(() => {
    const existing = localStorage.getItem("currentUser")

    if (!existing) {
      const user = {
        id: crypto.randomUUID(),
        name: "User" + Math.floor(Math.random() * 100),
      }

      localStorage.setItem(
        "currentUser",
        JSON.stringify(user)
      )
    }
  }, [])

  return null
}