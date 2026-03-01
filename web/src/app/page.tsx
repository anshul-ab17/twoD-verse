import Hero from "@/components/home/Hero"
import Link from "next/link"

export default function Home() {
  return (
    <Hero overlay="bg-black/5">

      <div className="text-center max-w-3xl text-white">

        {/* Wooden Title */}
        <div className="relative inline-block bg-[#8B5A2B] px-10 py-4 rounded-xl
                        border border-[#5A3B1C]
                        shadow-xl mb-6 overflow-hidden">

          {/* Wood Grain */}
          <div className="absolute inset-0 opacity-15 mix-blend-overlay
                          bg-[repeating-linear-gradient(45deg,#00000020_0px,#00000020_2px,transparent_2px,transparent_6px)]" />

          <h1 className="relative text-3xl font-extrabold tracking-wide text-yellow-200 drop-shadow-lg">
            Explore Virtual Space
          </h1>
        </div>

        <p className="text-xl font-bold text-yellow-200 drop-shadow-md mb-8">
          Gather with friends in interactive online rooms
        </p>

        <Link
          href="/signup"
          className="px-8 py-3 bg-[#556B2F] hover:bg-[#6B8E23]
                     text-white text-base font-bold rounded-xl
                     border border-[#3E4F1F]
                     shadow-lg hover:shadow-xl
                     hover:-translate-y-1
                     transition-all duration-200"
        >
          Create a Space
        </Link>

      </div>

    </Hero>
  )
}