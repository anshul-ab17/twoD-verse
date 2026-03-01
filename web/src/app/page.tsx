import Hero from "@/components/home/Hero"
import Link from "next/link"

export default function Home() {
  return (
    <Hero overlay="bg-black/10">

      <div className="text-center max-w-3xl text-white">

        {/* Wooden Header Board */}
        <div className="inline-block bg-[#8B5A2B] px-10 py-5 rounded-xl shadow-2xl border-4 border-[#5A3B1C] mb-8">
          <h1 className="text-5xl font-bold tracking-wide text-yellow-200 drop-shadow-lg">
            Explore Virtual Verse
          </h1>
        </div>

        <p className="text-xl text-white/90 mb-10">
          Gather with friends in interactive online rooms
        </p>

        <div className="flex justify-center gap-6">

          {/* Green Button */}
          <Link
            href="/signin"
            className="px-8 py-4 bg-[#2E7D32] hover:bg-[#256628] 
                       text-white font-semibold rounded-lg 
                       shadow-lg border-4 border-[#1B5E20] 
                       transition active:scale-95"
          >
            Enter a Space
          </Link>

          {/* Orange Button */}
          <Link
            href="/signup"
            className="px-8 py-4 bg-[#E59E2D] hover:bg-[#cc8c26] 
                       text-white font-semibold rounded-lg 
                       shadow-lg border-4 border-[#b57417] 
                       transition active:scale-95"
          >
            Create a Space
          </Link>

        </div>

      </div>

    </Hero>
  )
}