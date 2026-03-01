export default function HomeBackground({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full min-h-screen">
      
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/office.png')",
        }}
      />

      {/* Overlay Layer */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center pt-24">
        {children}
      </div>
    </div>
  )
}