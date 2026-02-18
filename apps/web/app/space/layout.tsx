import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Hero3D from "@/components/home/hero-3d"

export default async function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) redirect("/signin")

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      <div className="relative z-20">
        {children}
      </div>

    </div>
  )
}
