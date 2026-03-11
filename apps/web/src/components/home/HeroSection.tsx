import Link from "next/link"

const STATS = [
  { label: "Real-time", sublabel: "WebSocket sync" },
  { label: "4 Characters", sublabel: "Pixel-art avatars" },
  { label: "5 Themes", sublabel: "Office aesthetics" },
  { label: "WebRTC", sublabel: "Peer-to-peer video" },
]

export default function HeroSection() {
  return (
    <section
      id="hero"
      style={{ paddingTop: "7rem", paddingBottom: "6rem", position: "relative", overflow: "hidden" }}
    >
      {/* Dot grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, var(--text-dim) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Ambient orbs */}
      <div
        aria-hidden
        className="animate-orb"
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--orb-1) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        className="animate-orb"
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "-8%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--orb-2) 0%, transparent 70%)",
          pointerEvents: "none",
          animationDelay: "4s",
        }}
      />

      <div
        className="mx-auto px-6 text-center"
        style={{ maxWidth: "860px", position: "relative", zIndex: 1 }}
      >
        {/* Badge */}
        <div
          className="animate-fadeUp inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold mb-8"
          style={{
            background: "var(--badge-bg)",
            borderColor: "var(--badge-border)",
            color: "var(--green-bright)",
          }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green-bright)", display: "inline-block" }}
          />
          Now in Early Access
        </div>

        {/* Headline */}
        <h1
          className="animate-fadeUp text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
          style={{ animationDelay: "80ms", color: "var(--text)" }}
        >
          Virtual office for teams,{" "}
          <span className="gradient-text">Reimagined.</span>
        </h1>

        {/* Subtext */}
        <p
          className="animate-fadeUp mx-auto mt-6 text-lg leading-relaxed md:text-xl"
          style={{ maxWidth: "600px", color: "var(--text-muted)", animationDelay: "160ms" }}
        >
          Gather your team in immersive 2D spaces. Real-time movement, proximity
          voice &amp; video, chat, Spotify — everything your team needs in one place.
        </p>

        {/* CTAs */}
        <div
          className="animate-fadeUp mt-10 flex flex-wrap justify-center gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Link
            href="/signup"
            className="rounded-xl px-8 py-3 text-base font-semibold transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 4px 20px var(--accent-bg)" }}
          >
            Get Started Free
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border px-8 py-3 text-base font-medium transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: "var(--bg-card)", borderColor: "var(--card-border)", color: "var(--text-muted)" }}
          >
            See how it works
          </a>
        </div>

        {/* Stat pills */}
        <div
          className="animate-fadeUp mt-14 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "320ms" }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border px-4 py-2 text-center"
              style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.label}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.sublabel}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
