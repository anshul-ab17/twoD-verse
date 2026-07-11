"use client"

import { useState } from "react"
import { LandingNav } from "../_components/landing/landing-nav"
import { Footer } from "../_components/landing/sections"
import { PixiWorld } from "../verse/_components/PixiWorld"

export default function ThemesPage() {
  const [activeTheme, setActiveTheme] = useState<"office" | "cafe" | "zen" | "library" | "lounge">("office")

  return (
    <div className="bg-[#fcfcfa] min-h-screen flex flex-col justify-between">
      <LandingNav phase="done" />
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col gap-6">
        
        {/* Header Block with Title and Top-Right Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-zinc-200">
          <div>
            <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-400">interactive sandbox</p>
            <h1 
              className="mt-2 text-black font-normal tracking-tight text-4xl sm:text-5xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Playable Office Themes
            </h1>
            <p className="mt-3 max-w-xl text-sm text-zinc-500 leading-relaxed font-sans">
              Use WASD or arrow keys to test room scale boundaries, walk up to NPCs for audio notifications, and explore the layout.
            </p>
          </div>

          {/* Controls casually appearing above the themes */}
          <div className="flex gap-1.5 self-start md:self-auto">
            {(["office", "cafe", "zen", "library", "lounge"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTheme(t)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase transition-all cursor-pointer rounded-lg border ${
                  activeTheme === t
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-500 hover:text-black border-zinc-200 shadow-sm"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        {/* Full screen fitting simulator frame */}
        <div className="flex-1 w-full aspect-video min-h-[560px] border border-zinc-300 shadow-xl rounded-[24px] overflow-hidden bg-[#efe9dd]">
          <PixiWorld theme={activeTheme} userName="Guest" />
        </div>
      </main>
      <Footer />
    </div>
  )
}
