export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl text-white ${className}`}
    >
      {children}
    </div>
  )
}