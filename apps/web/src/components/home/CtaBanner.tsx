import Link from "next/link"

export default function CtaBanner() {
  return (
    <section style={{ padding: "5rem 0" }}>
      <div className="mx-auto px-6" style={{ maxWidth: "860px" }}>
        <div
          className="rounded-3xl border px-8 py-14 text-center"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#c07600" }}
          >
            Ready to start?
          </p>
          <h2 className="text-3xl font-bold md:text-4xl mb-4" style={{ color: "var(--text)" }}>
            Build your virtual office today
          </h2>
          <p
            className="mb-8 text-base"
            style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto 2rem" }}
          >
            Free to get started. Invite your team in seconds. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl px-10 py-3.5 text-base font-semibold transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: "#c07600", color: "#fff" }}
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </section>
  )
}
