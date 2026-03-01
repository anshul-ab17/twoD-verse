export default function AuthBackground({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="min-h-screen bg-cover bg-center relative flex items-center justify-center pt-24"
      style={{
        backgroundImage: "url('/office.png')",
      }}
    >
      {/* Stronger blur */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-lg" />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}