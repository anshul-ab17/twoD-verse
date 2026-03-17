import {
  Bell,
  Map,
  Search,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import SidebarChatIcon from "./SidebarChatIcon";
import { useSpaceSidebar } from "./SpaceSidebarContext";

function SpotifyIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

interface Props {
  isOpen: boolean;
  toggle: () => void;
  onIconAction?: () => void;
}

export default function SidebarRail({ isOpen, toggle, onIconAction }: Props) {
  const {
    activePane,
    activatePane,
    unreadNotificationCount,
    unreadDmCount,
    friends,
    members,
  } = useSpaceSidebar()

  type PaneId = "chat" | "notifications" | "map" | "search" | "spotify" | "friends"

  const iconBtn = (pane: PaneId) => ({
    background: activePane === pane ? "var(--accent-bg)" : "transparent",
    color: activePane === pane ? "var(--accent)" : "var(--text-muted)",
    borderRadius: 8,
    padding: 6,
    cursor: "pointer",
    transition: "all 0.15s",
    position: "relative" as const,
  })

  const handlePaneClick = (pane: PaneId) => {
    activatePane(pane)
    onIconAction?.()
  }

  const onlineFriendCount = friends.filter((f) =>
    members.some((m) => m.id === f.id)
  ).length

  return (
    <div
      className="flex flex-col items-center h-full py-6"
      style={{ color: "var(--text-muted)" }}
    >
      <button
        onClick={toggle}
        className="mb-10 p-2 rounded-lg transition"
        style={{ color: "var(--text-muted)" }}
        title={isOpen ? "Collapse" : "Expand"}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <div className="flex flex-col gap-6">
        <button
          title="Chat"
          style={iconBtn("chat")}
          onClick={() => handlePaneClick("chat")}
        >
          <SidebarChatIcon active={activePane === "chat"} unreadCount={unreadDmCount} />
        </button>

        <button
          title="Friends"
          style={iconBtn("friends")}
          onClick={() => handlePaneClick("friends")}
        >
          <Users size={20} />
          {onlineFriendCount > 0 && (
            <span
              className="absolute -right-2 -top-2 min-w-4 rounded-full px-1 text-center text-[10px] font-semibold"
              style={{ background: "#4ade80", color: "#000" }}
            >
              {onlineFriendCount > 9 ? "9+" : onlineFriendCount}
            </span>
          )}
        </button>

        <button
          title="Notifications"
          style={iconBtn("notifications")}
          onClick={() => handlePaneClick("notifications")}
        >
          <Bell size={20} />
          {unreadNotificationCount > 0 && (
            <span
              className="absolute -right-2 -top-2 min-w-4 rounded-full px-1 text-center text-[10px] font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          title="Map"
          style={iconBtn("map")}
          onClick={() => handlePaneClick("map")}
        >
          <Map size={20} />
        </button>

        <button
          title="Search Users"
          style={iconBtn("search")}
          onClick={() => handlePaneClick("search")}
        >
          <Search size={20} />
        </button>

        <button
          title="Spotify"
          style={{
            ...iconBtn("spotify"),
            color: activePane === "spotify" ? "#1DB954" : "var(--text-muted)",
          }}
          onClick={() => handlePaneClick("spotify")}
        >
          <SpotifyIcon size={20} />
        </button>
      </div>

      <div className="mt-auto" />
    </div>
  );
}
