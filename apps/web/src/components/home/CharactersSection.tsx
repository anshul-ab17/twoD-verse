import Link from "next/link"

const CHARS = [
  { name: "Adam", img: "/asset/character/single/Adam_idle_anim_1.png" },
  { name: "Ash", img: "/asset/character/single/Ash_idle_anim_1.png" },
  { name: "Lucy", img: "/asset/character/single/Lucy_idle_anim_1.png" },
  { name: "Nancy", img: "/asset/character/single/Nancy_idle_anim_1.png" },
]

export default function CharactersSection() {
  return (
    <section style={{ background: "var(--section-alt)", padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "1100px" }}>
        <div className="flex flex-col items-center gap-12 md:flex-row">
          {/* Text */}
          <div className="flex-1">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--accent)" }}
            >
              Characters
            </p>
            <h2 className="text-3xl font-bold md:text-4xl mb-4" style={{ color: "var(--text)" }}>
              Choose your avatar
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              Pick from 4 unique pixel-art characters — Adam, Ash, Lucy, or Nancy.
              Your avatar moves in real-time as you explore the 2D office together.
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5"
              style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 4px 16px var(--accent-bg)" }}
            >
              Start for free
            </Link>
          </div>

          {/* Character grid */}
          <div className="grid grid-cols-2 gap-4 flex-1">
            {CHARS.map((c) => (
              <div
                key={c.name}
                className="card-hover flex flex-col items-center justify-center gap-3 rounded-2xl border p-5"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--card-border)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.img}
                  alt={c.name}
                  width={56}
                  height={56}
                  style={{ imageRendering: "pixelated" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
