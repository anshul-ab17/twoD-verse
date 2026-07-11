"use client"

// Character selection grid. Shows _sit.png portrait (single-frame upper-body)
// for each crew member. Stores selection in localStorage key "verse_character".

const CHARACTERS = [
  "luffy", "zoro", "nami", "sanji",
  "robin", "brook", "chopper", "usopp",
] as const

export type CharacterName = (typeof CHARACTERS)[number]

export function CharacterPicker({ onPick }: { onPick: (name: CharacterName) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold tracking-tight">Choose your character</h1>
        <div className="grid grid-cols-4 gap-3">
          {CHARACTERS.map((name) => (
            <button
              key={name}
              onClick={() => onPick(name)}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-4 transition-colors duration-150 hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)]"
            >
              <img
                src={`/_godot/assets/characters/${name}_sit.png`}
                alt={name}
                style={{ imageRendering: "pixelated", height: 80, width: "auto" }}
              />
              <span className="text-sm capitalize text-[var(--text-secondary)]">{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
