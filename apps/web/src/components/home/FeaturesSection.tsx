const FEATURES = [
  {
    icon: "🗺️",
    title: "Interactive 2D World",
    desc: "Move freely through beautifully designed office spaces. Proximity-based interactions make collaboration feel natural.",
  },
  {
    icon: "🎙️",
    title: "Proximity Voice & Video",
    desc: "Talk to teammates nearby automatically. No meeting links, no context switching — just walk up and start talking.",
  },
  {
    icon: "💬",
    title: "Space & Direct Chat",
    desc: "Send messages to everyone in a space or have private conversations with any teammate, all in one place.",
  },
  {
    icon: "🎵",
    title: "Spotify Integration",
    desc: "Search and preview tracks without leaving the office. Set the vibe for your team's workspace.",
  },
  {
    icon: "🎨",
    title: "5 Office Themes",
    desc: "Choose from Woody, Neon, Forest, Corporate, or Midnight. Customize the vibe of every space.",
  },
  {
    icon: "👥",
    title: "Friends & Presence",
    desc: "Build your network, see who's online, and chat with friends across all your spaces instantly.",
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" style={{ background: "var(--section-alt)", padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        <div className="mb-12 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            Features
          </p>
          <h2 className="text-4xl font-bold md:text-6xl" style={{ color: "var(--text)" }}>
            Everything you need to collaborate
          </h2>
          <p
            className="mt-4 text-base"
            style={{ color: "var(--text-muted)", maxWidth: 500, margin: "1rem auto 0" }}
          >
            TwoDverse brings the spontaneity of in-person work to distributed teams.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card-hover rounded-2xl border p-6"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--card-border)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
              >
                {f.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: "var(--text)" }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
