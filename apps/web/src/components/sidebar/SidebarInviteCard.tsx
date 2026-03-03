export default function SidebarInviteCard() {
  return (
    <div
      className="
        bg-gradient-to-br 
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
        {["#facc15", "#4ade80", "#fb7185", "#60a5fa"].map(
          (color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-[#1f2a1f]"
              style={{ backgroundColor: color }}
            />
          )
        )}
      </div>

      {/* Olive Invite Button */}
      <button
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