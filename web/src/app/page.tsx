import Hero from "@/components/home/Hero"
import Link from "next/link"
import Button from "@/components/ui/Button"

export default function Home() {
  return (
    <Hero>
      <div className="text-center text-white max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">
          Explore Virtual Spaces
        </h1>

        <p className="text-lg text-white/80 mb-8">
          Gather, collaborate, and build shared digital worlds.
        </p>

        <div className="flex justify-center gap-6">
          <Link href="/signin">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </Hero>
  )
}