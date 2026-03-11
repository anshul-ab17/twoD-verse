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
  return (
    <section id="how-it-works" style={{ padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "900px" }}>
        <div className="mb-12 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--accent)" }}
          >
            How it works
          </p>
          <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "var(--text)" }}>
            Up and running in minutes
          </h2>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {/* Connector line */}
          <div
            aria-hidden
            className="hidden md:block absolute top-10 left-1/6 right-1/6"
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent, var(--card-border), transparent)",
            }}
          />

          {STEPS.map((step) => (
            <div key={step.n} className="relative flex flex-col items-center text-center px-4">
              <div
                className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 text-2xl font-extrabold"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--accent-border)",
                  color: "var(--accent)",
                  boxShadow: "0 0 24px var(--accent-bg)",
                }}
              >
                {step.n}
              </div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: "var(--text)" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
