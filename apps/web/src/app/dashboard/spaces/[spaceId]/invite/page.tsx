"use client"

import { useParams, useRouter } from "next/navigation"

export default function InvitePage() {
  const { spaceId } = useParams()
  const router = useRouter()

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/spaces/${spaceId}`
      : ""

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div
          className="rounded-2xl border p-10 shadow-2xl"
          style={{ background: "var(--bg-card)", borderColor: "var(--card-border)" }}
        >
          <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text)" }}>
            Invite your team
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Share this link to bring collaborators into your space.
          </p>

          <div className="flex gap-2 mb-6">
            <input
              readOnly
              value={shareLink}
              className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
              style={{
                background: "var(--bg)",
                borderColor: "var(--card-border)",
                color: "var(--text)",
              }}
            />
            <button
              onClick={() => navigator.clipboard.writeText(shareLink)}
              className="rounded-lg px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Copy
            </button>
          </div>

          <button
            onClick={() => router.push(`/dashboard/spaces/${spaceId}`)}
            className="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Continue to Space
          </button>
        </div>
      </div>
    </div>
  )
}
