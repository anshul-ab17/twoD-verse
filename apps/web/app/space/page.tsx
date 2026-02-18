import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Hero3D from "@/components/home/hero-3d"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) redirect("/signin")

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">

      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      <div className="relative z-20 px-16 pt-28">

        <div className="flex items-center justify-between">

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
             Your Spaces

            </h1>

          </div>
          <button
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium
                       transition hover:bg-indigo-500"
          >
            + Create New Space
          </button>
        </div>

      </div>

    </div>
  )
}
