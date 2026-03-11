import LandingNavbar from "@/components/home/LandingNavbar"
import HeroSection from "@/components/home/HeroSection"
import FeaturesSection from "@/components/home/FeaturesSection"
import HowItWorksSection from "@/components/home/HowItWorksSection"
import CtaBanner from "@/components/home/CtaBanner"
import LandingFooter from "@/components/home/LandingFooter"

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaBanner />
      <LandingFooter />
    </div>
  )
}
