const SPACES = [
  {
    icon: "🏢",
    name: "Office Hub",
    desc: "Open floor plan for daily standups, watercooler chats, and cross-team collaboration.",
  },
  {
    icon: "🧘",
    name: "Focus Room",
    desc: "Quiet zones with proximity gates — walk in to signal deep work mode, no interruptions.",
  },
  {
    icon: "🎮",
    name: "Lounge",
    desc: "A casual space to hang out, play music, and bond with teammates outside of work topics.",
  },
]

export default function SpacesSection() {
  return (
    <section id="spaces" style={{ background: "var(--section-alt)", padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        <div className="mb-14 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            Spaces
          </p>
          <h2 className="text-4xl font-bold md:text-6xl" style={{ color: "var(--text)" }}>
            Build your perfect office
          </h2>
          <p
            className="mt-4 text-base"
            style={{ color: "var(--text-muted)", maxWidth: 480, margin: "1rem auto 0" }}
          >
            Every team is different. Design spaces that match how your team actually works.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SPACES.map((s) => (
            <div
              key={s.name}
              className="card-hover rounded-2xl border p-8 text-center"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
              >
                {s.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--text)" }}>
                {s.name}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
