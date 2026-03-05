import RequireSession from "@/components/providers/RequireSession"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RequireSession>{children}</RequireSession>
}
