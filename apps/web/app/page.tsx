import { LandingNav } from "./_components/landing/landing-nav"
import { Hero, ClientLogoReel, Features, StrategySection, HowItWorks, Footer } from "./_components/landing/sections"

export default function Page() {
  return (
    <>
      <LandingNav />
      <Hero />
      <ClientLogoReel />
      <Features />
      <StrategySection />
      <HowItWorks />
      <Footer />
    </>
  )
}
