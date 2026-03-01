export default function DashboardBackground({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen bg-cover bg-center relative pt-28 px-8"
      style={{
        backgroundImage: "url('/office.png')",
      }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}