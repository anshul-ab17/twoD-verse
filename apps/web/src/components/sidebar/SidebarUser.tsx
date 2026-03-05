import { useSpaceSidebar } from "./SpaceSidebarContext";
import { getAvatarColor, getUserInitials } from "./avatar";

interface Props {
  collapsed?: boolean;
}

export default function SidebarUser({ collapsed }: Props) {
  const { currentUser } = useSpaceSidebar()
  const displayName = currentUser?.name || "Guest"
  const avatarUrl = currentUser?.avatarUrl
  const initials = getUserInitials(displayName)
  const avatarSeed = currentUser?.id || displayName

  return (
    <div className="flex items-center gap-3 p-2">

      <div className="relative">
        <div
          className="w-10 h-10 overflow-hidden rounded-full flex items-center justify-center font-semibold text-black"
          style={
            avatarUrl
              ? {
                  backgroundImage: `url(${avatarUrl})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : {
                  backgroundColor: getAvatarColor(avatarSeed),
                }
          }
        >
          {!avatarUrl && initials}
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
