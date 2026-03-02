"use client"

export default function SpaceSidebar() {
  return (
    <div className="w-70 bg-[#1c1c1c] text-white p-6 flex flex-col justify-between">

      <div>
        <h2 className="text-lg font-semibold mb-6">
          Experience Virtual Verse
        </h2>

        <button className="w-full py-3 bg-indigo-600 rounded-lg mb-6">
          Invite
        </button>

        <div className="mt-6">
          <p className="text-sm text-gray-400 mb-2">
            Online (1)
          </p>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black">
              S
            </div>
            <span>starboy.ab.17</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Virtual Verse v1
      </div>
    </div>
  )
}