import { useSpaceSidebar } from "./SpaceSidebarContext";

interface Props {
  collapsed?: boolean;
}

export default function SidebarUser({ collapsed }: Props) {
  const { currentUser } = useSpaceSidebar()
  const displayName = currentUser?.name || "Guest"
  const initials = displayName.slice(0, 1).toUpperCase() || "G"

  return (
    <div className="flex items-center gap-3 p-2">

      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-semibold text-black">
          {initials}
        </div>

        <span
          className="
            absolute bottom-0 right-0 
            w-3 h-3 bg-green-500 
            border-2 border-[#3b2a1a] 
            rounded-full
          "
        />
      </div>

      {!collapsed && (
        <div>
          <p className="text-sm text-yellow-200">
            {displayName}
          </p>
          <p className="text-xs text-green-400">
            Active
          </p>
        </div>
      )}
    </div>
  );
}
