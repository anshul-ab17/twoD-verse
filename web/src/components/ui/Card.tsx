import React from "react"

export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl text-white ${className}`}
    >
      {children}
    </div>
  )
}