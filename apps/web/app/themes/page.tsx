"use client"

import { LandingNav } from "../_components/landing/landing-nav"
import { GamifiedOfficeSpacePreview, Footer } from "../_components/landing/sections"

export default function ThemesPage() {
  return (
    <div className="bg-[#fcfcfa] min-h-screen flex flex-col justify-between">
      <LandingNav phase="done" />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 pt-32 pb-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-400">interactive preview</p>
          <h1 
            className="mt-3 text-black font-normal tracking-tight text-4xl sm:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Playable Office Themes
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-sm text-zinc-500 leading-relaxed">
            Walk Luffy, Robin, Brook, and Chopper through our curated 2D spaces to test floorplan scales, spatial audio coordinates, and room settings.
          </p>
        </div>
        
        {/* Full size interactive desk simulator */}
        <div className="w-full aspect-video min-h-[500px] border border-zinc-200 shadow-2xl rounded-[24px] overflow-hidden bg-white">
          <GamifiedOfficeSpacePreview />
        </div>
      </main>
      <Footer />
    </div>
  )
}
