export default function Topbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
      </div>
    </header>
  )
}