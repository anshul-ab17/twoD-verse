import Sidebar from "@/components/sidebar/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-[#0f0f1a] to-black">
      <Sidebar />

      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}