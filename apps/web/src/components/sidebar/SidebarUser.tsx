interface Props {
  collapsed?: boolean;
}

export default function SidebarUser({ collapsed }: Props) {
  return (
    <div className="flex items-center gap-3 p-2">

      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center font-semibold text-black">
          S
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
            ab.17
          </p>
          <p className="text-xs text-green-400">
            Active
          </p>
        </div>
      )}
    </div>
  );
}