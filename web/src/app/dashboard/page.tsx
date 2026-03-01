import Hero from "@/components/home/Hero"

export default function Dashboard() {
  return (
    <Hero
      overlay="bg-black/30"
      blur="backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto text-white">
        <h1 className="text-3xl font-semibold mb-10">
          Your Spaces
        </h1>

        <div className="grid grid-cols-3 gap-8">

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-[#E59E2D] transition">
            Creative Hub
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            Team Room
          </div>

        </div>
      </div>
    </Hero>
  )
}