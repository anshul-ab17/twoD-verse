"use client"

import { useState } from "react"
import { LandingNav } from "./_components/landing/landing-nav"
import { Loader } from "./_components/landing/loader"
import { 
  Hero, 
  ClientLogoReel, 
  Features, 
  ThemesShowcase,
  StrategySection, 
  HowItWorks, 
  FAQ,
  Footer
} from "./_components/landing/sections"

type Phase = "loading" | "exit" | "done"

export default function Page() {
  const [phase, setPhase] = useState<Phase>("loading")

  return (
    <>
      <Loader onPhaseChange={(p) => setPhase(p)} onDone={() => {}} />
      <div
        style={{
          opacity: phase !== "loading" ? 1 : 0,
          transition: "opacity 0.7s ease",
          visibility: phase !== "loading" ? "visible" : "hidden",
        }}
      >
        <LandingNav phase={phase} />
        <Hero phase={phase} />
        <ClientLogoReel />
        <Features />
        <ThemesShowcase />
        <StrategySection />
        <HowItWorks />
        <FAQ />
        <Footer />
      </div>
    </>
  )
}
