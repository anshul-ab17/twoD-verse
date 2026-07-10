import Link from "next/link"

const FEATURES = [
  { icon: "🗺", title: "2.5D World", text: "A living office you walk through — desks, lounges, meeting rooms, day and night." },
  { icon: "🎙", title: "Spatial Voice & Video", text: "Walk up to someone and voice connects automatically. Walk away, it fades." },
  { icon: "🤖", title: "AI Meeting Notes", text: "Every meeting gets a summary, decisions, and action items — without asking." },
  { icon: "🎯", title: "XP & Streaks", text: "Show up, focus, help teammates — the world rewards the habit." },
]

const STEPS = [
  { n: "1", title: "Create a space", text: "Pick a template — office, campus, hackathon, lounge." },
  { n: "2", title: "Invite your team", text: "One link. No installs, no onboarding decks." },
  { n: "3", title: "Walk in", text: "Presence is instant — voice connects when you get close." },
]

export function Hero() {
  return (
    <header
      className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12"
      style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.18), transparent)" }}
    >
      <span className="rounded-full border border-[var(--accent)]/20 bg-[var(--accent-dim)] px-3 py-1 text-xs font-medium text-[var(--accent-bright)]">
        Now in beta · Join the first teams
      </span>
      <h1 className="mt-6 text-center text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]">
        Work together.
        <br />
        <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          Play together.
        </span>
      </h1>
      <p className="mt-6 max-w-xl text-center text-xl text-[var(--text-secondary)]">
        The gamified office where showing up feels like logging into your favorite game.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link href="/verse"
          className="rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-bright)] px-8 py-3.5 text-base font-medium text-white transition-colors duration-200">
          Enter the Verse
        </Link>
        <a href="#how" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors duration-200">
          ▶ See how it works
        </a>
      </div>
      <div className="relative mt-16 w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border-default)] shadow-[0_0_80px_rgba(124,58,237,0.15)]">
        {/* ponytail: gradient placeholder — swap for a real world screenshot/gif when captured */}
        <div className="aspect-video w-full bg-gradient-to-br from-[#1a1030] via-[#101018] to-[#0a1a20] flex items-center justify-center text-[var(--text-muted)]">
          world preview
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-base)]" />
      </div>
    </header>
  )
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-32">
      <p className="text-sm font-medium uppercase tracking-widest text-[var(--accent-bright)]">Why Verse</p>
      <h2 className="mt-4 text-4xl font-bold">A world worth returning to</h2>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 transition-all duration-200 hover:border-[var(--border-default)]">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="px-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-12">
        <h2 className="text-3xl font-bold text-center">Up and running in minutes</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CtaBanner() {
  return (
    <section id="cta" className="px-6 py-32">
      <div className="mx-auto max-w-6xl rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 p-16 text-center">
        <h2 className="text-4xl font-bold">Ready to make work feel alive?</h2>
        <Link href="/verse"
          className="mt-8 inline-block rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-bright)] px-10 py-4 font-medium text-white transition-colors duration-200">
          Enter the Verse
        </Link>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--text-muted)] md:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent-bright)]">◈</span> Verse · © 2026
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition-colors duration-200">Privacy</a>
          <a href="#" className="hover:text-white transition-colors duration-200">Terms</a>
          <a href="#" className="hover:text-white transition-colors duration-200">GitHub</a>
        </div>
      </div>
    </footer>
  )
}
