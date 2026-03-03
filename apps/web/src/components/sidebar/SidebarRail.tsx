import {
  MessageSquare,
  Bell,
  Map,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  toggle: () => void;
}

export default function SidebarRail({ isOpen, toggle }: Props) {
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
        <MessageSquare className="hover:text-yellow-400 cursor-pointer" />
        <Bell className="hover:text-yellow-400 cursor-pointer" />
        <Map className="hover:text-yellow-400 cursor-pointer" />
        <Search className="hover:text-yellow-400 cursor-pointer" />
      </div>

      {/* Spacer pushes bottom content if needed later */}
      <div className="mt-auto" />
    </div>
  );
}