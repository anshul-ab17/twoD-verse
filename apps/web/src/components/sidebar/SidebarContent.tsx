import SidebarInviteCard from "./SidebarInviteCard";
import SidebarUser from "./SidebarUser";

interface Props {
  toggle: () => void;
}

export default function SidebarContent({ toggle }: Props) {
  return (
    <div className="flex flex-col h-full p-4 text-yellow-100">

      {/* Header (NO CHEVRON NOW) */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-yellow-300">
          home
        </h1>
      </div>

      {/* Invite Card */}
      <SidebarInviteCard />

      {/* Search */}
      <input
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

      {/* User Section */}
      <div className="mt-auto">
        <SidebarUser />
      </div>
    </div>
  );
}