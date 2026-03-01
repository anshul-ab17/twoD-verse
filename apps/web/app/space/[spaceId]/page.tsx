import HomeBackground from "@/components/home/HomeBackground"
import Link from "next/link"

export default function Home() {
  return (
    <HomeBackground>
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-5xl font-bold mb-6">
          Explore Virtual Spaces
        </h1>
        <p className="mb-8 text-lg">
          Gather with friends and collaborate in shared environments.
        </p>

        <div className="flex justify-center gap-6">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
          >
            Enter a Space
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-3 bg-orange-500 text-white rounded-xl shadow hover:bg-orange-600 transition"
          >
            Create a Space
          </Link>
        </div>
      </div>
    </HomeBackground>
  )
}