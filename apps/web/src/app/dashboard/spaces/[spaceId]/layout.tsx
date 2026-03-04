import Sidebar from "@/components/sidebar/Sidebar"
import { SpaceSidebarProvider } from "@/components/sidebar/SpaceSidebarContext"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SpaceSidebarProvider>
      <div className="h-screen overflow-hidden bg-linear-to-br from-black via-[#0f0f1a] to-black">
        <Sidebar />

        <main className="h-screen min-w-0 overflow-hidden p-4 md:pl-[104px] lg:pl-[372px] lg:pr-6 lg:py-6">
          {children}
        </main>
      </div>
    </SpaceSidebarProvider>
  )
}
