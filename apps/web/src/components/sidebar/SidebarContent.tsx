import { useEffect, useMemo, useRef } from "react";
import SidebarInviteCard from "./SidebarInviteCard";
import SidebarUser from "./SidebarUser";
import { useSpaceSidebar } from "./SpaceSidebarContext";

interface Props {
  toggle: () => void;
}

export default function SidebarContent({ toggle }: Props) {
  const {
    activePane,
    activatePane,
    currentUser,
    members,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    notifications,
    openChatWithUser,
  } = useSpaceSidebar()
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const otherMembers = useMemo(
    () => filteredMembers.filter((member) => member.id !== currentUser?.id),
    [currentUser?.id, filteredMembers]
  )

  const panelTitle =
    activePane === "chat"
      ? "chat"
      : activePane === "search"
        ? "search users"
        : activePane === "notifications"
          ? "notifications"
          : "home"

  useEffect(() => {
    if (activePane !== "search") return
    searchInputRef.current?.focus()
  }, [activePane])

  return (
    <div className="flex flex-col h-full p-4 text-yellow-100">

      {/* Header (NO CHEVRON NOW) */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-yellow-300">
          {panelTitle}
        </h1>
      </div>

      {/* Invite Card */}
      {activePane === "map" && <SidebarInviteCard />}

      {/* Search */}
      <input
        ref={searchInputRef}
        value={searchQuery}
        onFocus={() => activatePane("search")}
        onChange={(event) => {
          setSearchQuery(event.target.value)
          activatePane("search")
        }}
        placeholder="Search people"
        className="
          bg-[#1f2a1f]
          border border-[#556b2f]
          p-2 rounded-lg mt-4
          text-sm
          text-yellow-200
          placeholder:text-yellow-400/60
        "
      />

      {activePane === "search" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-[#6b4b2a] bg-[#1a140f]">
          {otherMembers.length === 0 ? (
            <p className="p-3 text-xs text-yellow-300/70">No users found in this space.</p>
          ) : (
            otherMembers.map((member) => (
              <button
                key={member.id}
                className="flex w-full items-center justify-between border-b border-[#3e2a16] px-3 py-2 text-left text-sm hover:bg-[#2e2014]"
                onClick={() => {
                  openChatWithUser(member.id)
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    toggle()
                  }
                }}
              >
                <span className="text-yellow-100">{member.name}</span>
                <span className="text-[11px] text-yellow-300/75">chat</span>
              </button>
            ))
          )}
        </div>
      )}

      {activePane === "notifications" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-[#6b4b2a] bg-[#1a140f]">
          {notifications.length === 0 ? (
            <p className="p-3 text-xs text-yellow-300/70">No new activity in this space.</p>
          ) : (
            notifications.map((entry) => (
              <div key={entry.id} className="border-b border-[#3e2a16] px-3 py-2">
                <p className="text-sm text-yellow-100">{entry.message}</p>
                <p className="text-[11px] text-yellow-300/70">
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activePane === "chat" && (
        <div className="mt-3 rounded-lg border border-[#6b4b2a] bg-[#1a140f] p-3 text-sm text-yellow-200/85">
          <p className="font-medium text-yellow-100">Chat mode active</p>
          <p className="mt-1 text-xs">Use the map icon to return to map view and press it again to jump back to your current chat.</p>
        </div>
      )}

      <div className="mt-4 text-xs text-yellow-300/70">
        {members.length} users in this space
      </div>

      {/* User Section */}
      <div className="mt-auto">
        <SidebarUser />
      </div>
    </div>
  );
}
