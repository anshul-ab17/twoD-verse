"use client"

export default function SidePanel({
  userName,
  spaceName,
  open,
  setOpen,
}: {
  userName: string
  spaceName: string
  open: boolean
  setOpen: (v: boolean) => void
}) {
  return (
    <div
      className={`fixed top-0 left-0 h-screen bg-black text-white flex flex-col
      transition-all duration-300 z-50
      ${open ? "w-80 p-6" : "w-0 p-0 overflow-hidden"}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute top-4 right-4 bg-neutral-800 text-white px-3 py-1 rounded-md"
      >
        {open ? "←" : "→"}
      </button>

      {open && (
        <>
          <div className="mb-8 mt-10"> 
            <p className="text-sm text-gray-400 mt-2">
              Logged in as {userName}
            </p>
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {spaceName}
            </h2>
          </div>

          <button className="bg-red-700 rounded-md py-2 mt-auto">
            Back to Dashboard
          </button>
        </>
      )}
    </div>
  )
}
