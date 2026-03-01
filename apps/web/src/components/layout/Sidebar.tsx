"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Overview", href: "/dashboard" },
    { name: "Spaces", href: "/dashboard/spaces" },
    { name: "Profile", href: "/dashboard/profile" },
  ]

  return (
    <aside className="w-64 bg-gray-900 text-white p-6">
      <h1 className="text-xl font-bold mb-8">
        Virtual Verse
      </h1>

      <nav className="space-y-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block ${
              pathname === link.href
                ? "text-blue-400"
                : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}