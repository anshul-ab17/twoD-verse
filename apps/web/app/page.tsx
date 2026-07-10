import { LandingNav } from "./_components/landing/landing-nav"
import { Hero, Features, HowItWorks, CtaBanner, Footer } from "./_components/landing/sections"

export default function Page() {
  return (
    <>
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <CtaBanner />
      <Footer />
    </>
  )
}
