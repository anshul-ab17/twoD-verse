"use client"

import { useState } from "react"

const STEPS = [
  {
    n: "01",
    title: "Create a Space",
    desc: "Set up your virtual office in seconds. Invite your team with a single link — no installs required.",
  },
  {
    n: "02",
    title: "Pick Your Character",
    desc: "Choose from Adam, Ash, Lucy, or Nancy. Your avatar represents you in the 2D world.",
  },
  {
    n: "03",
    title: "Collaborate Naturally",
    desc: "Move around, chat with nearby teammates, hop on spontaneous calls, and get work done together.",
  },
]

export default function HowItWorksSection() {
  const [current, setCurrent] = useState(0)
  const step = STEPS[current]

  return (
    <section id="how-it-works" style={{ padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "700px" }}>
        <div className="mb-14 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            How it works
          </p>
          <h2 className="text-4xl font-bold md:text-6xl" style={{ color: "var(--text)" }}>
            Up and running in minutes
          </h2>
        </div>

        {/* Slide */}
        <div
          className="rounded-3xl border p-10 text-center transition-all duration-300"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--card-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 text-3xl font-extrabold"
            style={{
              background: "var(--bg)",
              borderColor: "var(--accent-border)",
              color: "var(--accent)",
              boxShadow: "0 0 32px var(--accent-bg)",
            }}
          >
            {step.n}
          </div>
          <h3 className="mb-3 text-2xl font-bold" style={{ color: "var(--text)" }}>
            {step.title}
          </h3>
          <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)", maxWidth: 420, margin: "0 auto" }}>
            {step.desc}
          </p>
        </div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-150 disabled:opacity-30"
            style={{ background: "var(--bg-card)", borderColor: "var(--card-border)", color: "var(--text)" }}
            aria-label="Previous step"
          >
            ←
          </button>

          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === current ? 28 : 10,
                  height: 10,
                  background: i === current ? "var(--accent)" : "var(--card-border)",
                }}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
            disabled={current === STEPS.length - 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-150 disabled:opacity-30"
            style={{ background: "var(--bg-card)", borderColor: "var(--card-border)", color: "var(--text)" }}
            aria-label="Next step"
          >
            →
          </button>
        </div>
      </div>
    </section>
  )
}
