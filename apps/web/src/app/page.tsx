"use client"

import { useState } from "react"
import { LandingNav } from "@/features/landing/landing-nav"
import { Loader } from "@/features/landing/loader"
import { SignInModal } from "@/features/auth/SignInModal"
import {
  Hero,
  ClientLogoReel,
  Features,
  ThemesShowcase,
  StrategySection,
  HowItWorks,
  FAQ,
  Footer
} from "@/features/landing/sections"

type Phase = "loading" | "exit" | "done"

export default function Page() {
  const [phase, setPhase] = useState<Phase>("loading")
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <>
      <Loader onPhaseChange={(p) => setPhase(p)} onDone={() => {}} />
      <div
        style={{
          opacity: phase !== "loading" ? 1 : 0,
          transition: "opacity 0.7s ease, filter 0.2s ease",
          visibility: phase !== "loading" ? "visible" : "hidden",
          filter: authOpen ? "blur(3px)" : "none",
        }}
      >
        <LandingNav phase={phase} onOpenAuth={() => setAuthOpen(true)} />
        <Hero phase={phase} />
        <ClientLogoReel />
        <Features />
        <ThemesShowcase />
        <StrategySection onOpenAuth={() => setAuthOpen(true)} />
        <HowItWorks />
        <FAQ />
        <Footer />
      </div>
      <SignInModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  )
}
