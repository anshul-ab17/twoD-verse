"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Hero from "@/components/home/Hero"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/signin")
    }
  }, [router])

  return (
    <Hero
      overlay="bg-black/50"
      blur="backdrop-blur-[1px]"
      center={false}
    >
      <div className="max-w-6xl mx-auto text-white">
        <h1 className="text-3xl font-bold mb-8">
          Your Spaces
        </h1>

        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((space) => (
            <Card key={space}>
              <h2 className="text-xl font-semibold mb-2">
                Creative Hub
              </h2>
              <p className="text-white/70 mb-4">
                12 x 10
              </p>

              <Button className="bg-white/20 hover:bg-white/30 text-white">
                Enter
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </Hero>
  )
}