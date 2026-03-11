"use client"

import { useState } from "react"

type CharacterOption = {
  key: string
  name: string
  idleFrame: string
  description: string
}

const CHARACTERS: CharacterOption[] = [
  {
    key: "adam",
    name: "Adam",
    idleFrame: "/asset/character/single/Adam_idle_anim_1.png",
    description: "The classic explorer",
  },
  {
    key: "ash",
    name: "Ash",
    idleFrame: "/asset/character/single/Ash_idle_anim_1.png",
    description: "Cool and collected",
  },
  {
    key: "lucy",
    name: "Lucy",
    idleFrame: "/asset/character/single/Lucy_idle_anim_1.png",
    description: "Bright and energetic",
  },
  {
    key: "nancy",
    name: "Nancy",
    idleFrame: "/asset/character/single/Nancy_idle_anim_1.png",
    description: "Calm and creative",
  },
]

interface Props {
  onSelect: (characterKey: string) => void
}

export default function CharacterPicker({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div
        className="w-full max-w-md mx-4 rounded-2xl border p-8 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #1a0f08 0%, #0f0a06 100%)",
          borderColor: "#6b4b2a",
        }}
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-yellow-300">Choose Your Character</h2>
          <p className="mt-1 text-sm text-yellow-200/60">Pick an avatar before entering the space</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {CHARACTERS.map((char) => (
            <button
              key={char.key}
              type="button"
              onClick={() => setSelected(char.key)}
              className="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all duration-150"
              style={{
                borderColor: selected === char.key ? "#fbbf24" : "#4a3520",
                background: selected === char.key ? "rgba(251,191,36,0.12)" : "#1a0f08",
                outline: selected === char.key ? "2px solid #fbbf2440" : "none",
                outlineOffset: "2px",
              }}
            >
              <div className="h-14 w-14 overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={char.idleFrame}
                  alt={char.name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                  draggable={false}
                />
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: selected === char.key ? "#fbbf24" : "#d4a574" }}
              >
                {char.name}
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <p className="mb-4 text-center text-xs text-yellow-200/50">
            {CHARACTERS.find((c) => c.key === selected)?.description}
          </p>
        )}

        <button
          type="button"
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full rounded-xl py-3 text-sm font-semibold transition-all duration-150"
          style={{
            background: selected ? "#92400e" : "#2a1f10",
            color: selected ? "#fef3c7" : "#6b5a40",
            cursor: selected ? "pointer" : "not-allowed",
            border: `1px solid ${selected ? "#b45309" : "#3a2a18"}`,
          }}
          onMouseEnter={(e) => {
            if (selected) (e.target as HTMLButtonElement).style.background = "#a16207"
          }}
          onMouseLeave={(e) => {
            if (selected) (e.target as HTMLButtonElement).style.background = "#92400e"
          }}
        >
          Enter Space
        </button>
      </div>
    </div>
  )
}
