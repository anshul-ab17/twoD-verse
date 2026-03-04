"use client"

import { MessageSquare } from "lucide-react"

interface Props {
  active?: boolean
  unreadCount?: number
}

export default function SidebarChatIcon({ active = false, unreadCount = 0 }: Props) {
  return (
    <div className="relative">
      <MessageSquare className={active ? "text-yellow-200" : "text-yellow-300"} />
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-emerald-400 px-1 text-center text-[10px] font-semibold text-black">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  )
}
