import {
  Bell,
  Map,
  Search,
  Music2,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import SidebarChatIcon from "./SidebarChatIcon";
import { useSpaceSidebar } from "./SpaceSidebarContext";

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
    friends,
    members,
  } = useSpaceSidebar()

  type PaneId = "chat" | "notifications" | "map" | "search" | "spotify" | "friends"

  const iconClass = (pane: PaneId) =>
    `relative cursor-pointer rounded-lg p-1 transition ${
      activePane === pane
        ? "bg-[#3b2a1a] text-yellow-200"
        : "text-yellow-300 hover:text-yellow-400"
    }`

  const handlePaneClick = (pane: PaneId) => {
    activatePane(pane)
    onIconAction?.()
  }

  // Count online friends (in livePresence)
  const onlineFriendCount = friends.filter((f) =>
    members.some((m) => m.id === f.id)
  ).length

  return (
    <div className="flex flex-col items-center h-full py-6 text-yellow-300">

      <button
        onClick={toggle}
        className="mb-10 p-2 rounded hover:bg-[#3b2a1a]"
      >
        {isOpen ? <ChevronLeft /> : <ChevronRight />}
      </button>

      <div className="flex flex-col gap-8">
        <button
          title="Chat"
          className={iconClass("chat")}
          onClick={() => handlePaneClick("chat")}
        >
          <SidebarChatIcon active={activePane === "chat"} />
        </button>

        <button
          title="Friends"
          className={iconClass("friends")}
          onClick={() => handlePaneClick("friends")}
        >
          <Users size={20} />
          {onlineFriendCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-green-400 px-1 text-center text-[10px] font-semibold text-black">
              {onlineFriendCount > 9 ? "9+" : onlineFriendCount}
            </span>
          )}
        </button>

        <button
          title="Notifications"
          className={iconClass("notifications")}
          onClick={() => handlePaneClick("notifications")}
        >
          <Bell size={20} />
          {unreadNotificationCount > 0 && (
            <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-emerald-400 px-1 text-center text-[10px] font-semibold text-black">
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </span>
          )}
        </button>

        <button
          title="Map / Back To Chat"
          className={iconClass("map")}
          onClick={() => handlePaneClick("map")}
        >
          <Map size={20} />
        </button>

        <button
          title="Search Users"
          className={iconClass("search")}
          onClick={() => handlePaneClick("search")}
        >
          <Search size={20} />
        </button>

        <button
          title="Spotify"
          className={iconClass("spotify")}
          onClick={() => handlePaneClick("spotify")}
        >
          <Music2 size={20} />
        </button>
      </div>

      <div className="mt-auto" />
    </div>
  );
}
