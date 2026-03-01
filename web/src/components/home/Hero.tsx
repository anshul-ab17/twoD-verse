type HeroProps = {
  children: React.ReactNode
  overlay?: string
  blur?: string
}

export default function Hero({
  children,
  overlay = "bg-black/10",
  blur = "",
}: HeroProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/office.webp')",
        }}
      />

      {/* Overlay */}
      <div className={`absolute inset-0 ${overlay}`} />

      {/* Optional Blur */}
      {blur && (
        <div className={`absolute inset-0 ${blur}`} />
      )}

      {/* Floating Brand */}
      <div className="absolute top-6 left-8 text-white text-xl font-semibold tracking-wide drop-shadow-lg">
        TwoD<span className="text-[#E59E2D]">verse</span>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        {children}
      </div>
    </div>
  )
}