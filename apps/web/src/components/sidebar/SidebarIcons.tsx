import { Settings, Gift, Bell } from "lucide-react"

export default function SidebarIcons() {
  return (
    <div className="p-5 flex items-center justify-between text-gray-400">
      <button className="hover:text-white transition">
        <Gift size={20} />
      </button>

      <button className="hover:text-white transition">
        <Bell size={20} />
      </button>

      <button className="hover:text-white transition">
        <Settings size={20} />
      </button>
    </div>
  )
}