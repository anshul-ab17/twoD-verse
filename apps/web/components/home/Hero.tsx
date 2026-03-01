type HeroProps = {
  children: React.ReactNode
  overlay?: string
  blur?: string
  center?: boolean
}

export default function Hero({
  children,
  overlay = "bg-gradient-to-b from-black/70 via-black/60 to-black/80",
  blur = "backdrop-blur-[2px]",
  center = true,
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

      {/* Blur */}
      <div className={`absolute inset-0 ${blur}`} />

      {/* Content */}
      <div
        className={`relative z-10 min-h-screen pt-28 px-6 ${
          center
            ? "flex items-center justify-center"
            : ""
        }`}
      >
        {children}
      </div>
    </div>
  )
}