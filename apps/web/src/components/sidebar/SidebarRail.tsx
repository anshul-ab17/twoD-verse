import {
  Bell,
  Map,
  Search,
  ChevronRight,
  ChevronLeft,
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
  } = useSpaceSidebar()

  const iconClass = (pane: "chat" | "notifications" | "map" | "search") =>
    `relative cursor-pointer rounded-lg p-1 transition ${activePane === pane ? "bg-[#3b2a1a] text-yellow-200" : "text-yellow-300 hover:text-yellow-400"}`

  const handlePaneClick = (pane: "chat" | "notifications" | "map" | "search") => {
    activatePane(pane)
    onIconAction?.()
  }

  return (
    <div className="flex flex-col items-center h-full py-6 text-yellow-300">

      <button
        onClick={toggle}
        className="mb-10 p-2 rounded hover:bg-[#3b2a1a]"
      >
        {isOpen ? (
          <ChevronLeft />
        ) : (
          <ChevronRight />
        )}
      </button>

      {/* Icons */}
      <div className="flex flex-col gap-10">
        <button
          title="Chat"
          className={iconClass("chat")}
          onClick={() => handlePaneClick("chat")}
        >
          <SidebarChatIcon active={activePane === "chat"} />
        </button>

        <button
          title="Notifications"
          className={iconClass("notifications")}
          onClick={() => handlePaneClick("notifications")}
        >
          <Bell />
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
          <Map />
        </button>

        <button
          title="Search Users"
          className={iconClass("search")}
          onClick={() => handlePaneClick("search")}
        >
          <Search />
        </button>
      </div>

      {/* Spacer pushes bottom content if needed later */}
      <div className="mt-auto" />
    </div>
  );
}
