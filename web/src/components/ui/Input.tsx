import React from "react"

export default function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full p-3 rounded-lg bg-black/40 border border-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-green-400 transition ${className}`}
    />
  )
}