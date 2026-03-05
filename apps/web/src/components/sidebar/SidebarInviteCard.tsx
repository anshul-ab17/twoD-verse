"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSpaceSidebar } from "./SpaceSidebarContext"
import { getAvatarColor, getUserInitials } from "./avatar"

export default function SidebarInviteCard() {
  const { members } = useSpaceSidebar()
  const router = useRouter()
  const params = useParams<{ spaceId?: string }>()
  const spaceId = typeof params?.spaceId === "string" ? params.spaceId : ""
  const visibleMembers = useMemo(() => members.slice(0, 4), [members])
  const hiddenMembersCount = Math.max(members.length - visibleMembers.length, 0)

  const handleInvite = () => {
    if (spaceId) {
      router.push(`/dashboard/spaces/${spaceId}/invite`)
      return
    }

    router.push("/dashboard/spaces")
  }

  return (
    <div
      className="
        bg-linear-to-br 
        from-[#2f3e2f] 
        to-[#1f2a1f]
        border border-[#556b2f]
        rounded-xl
        p-5
        text-yellow-300
      "
    >
      <h3 className="font-semibold text-lg">
        Experience. Gather together
      </h3>

      <p className="text-sm text-yellow-200 mt-1">
        Invite your closest collaborators.
      </p>

      {/* Avatars */}
      <div className="flex -space-x-2 mt-3">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            title={member.name}
            className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#1f2a1f]"
            style={
              member.avatarUrl
                ? {
                    backgroundImage: `url(${member.avatarUrl})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : { backgroundColor: getAvatarColor(member.id) }
            }
          >
            {!member.avatarUrl && (
              <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-black">
                {getUserInitials(member.name)}
              </span>
            )}
          </div>
        ))}

        {hiddenMembersCount > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1f2a1f] bg-[#344225] text-[10px] font-semibold text-yellow-100">
            +{hiddenMembersCount}
          </div>
        )}
      </div>

      {/* Olive Invite Button */}
      <button
        onClick={handleInvite}
        className="
          w-full mt-4
          bg-[#556b2f]
          hover:bg-[#6b8e23]
          transition
          rounded-lg
          py-2
          text-sm
          font-medium
          text-white
        "
      >
        Invite
      </button>
    </div>
  );
}
