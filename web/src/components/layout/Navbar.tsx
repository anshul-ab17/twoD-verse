"use client"

import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="w-full px-8 py-4 flex justify-between items-center bg-white/70 backdrop-blur-md shadow-sm fixed top-0 z-50">
      <Link href="/" className="font-bold text-lg">
        TwoDverse
      </Link>

      <div className="flex gap-6">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/signin">Sign In</Link>
      </div>
    </nav>
  )
}