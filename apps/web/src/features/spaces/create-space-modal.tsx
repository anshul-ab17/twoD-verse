"use client"

import { useRef, useState } from "react"

export function CreateSpaceModal({ onCreate }: { onCreate: (name: string) => Promise<void> }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    setError("")
    try {
      await onCreate(name.trim())
      ref.current?.close()
      setName("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => ref.current?.showModal()}
        style={{
          background: "#111111",
          color: "#fff",
          fontSize: 14,
          fontWeight: 500,
          padding: "10px 22px",
          borderRadius: 999,
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#222222")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#111111")}
      >
        + New space
      </button>
      <dialog
        ref={ref}
        style={{
          margin: "auto",
          width: "100%",
          maxWidth: 448,
          borderRadius: 16,
          border: "1px solid rgba(24,21,16,0.14)",
          background: "#ffffff",
          padding: 0,
          color: "#181510",
          backdropFilter: "blur(8px)",
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      >
        <div style={{ padding: "24px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Create a space</h2>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Space name…"
            style={{
              marginTop: 16,
              width: "100%",
              borderRadius: 8,
              border: "1px solid rgba(24,21,16,0.14)",
              background: "#efe9dd",
              padding: "10px 14px",
              fontSize: 14,
              outline: "none",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
              color: "#181510",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#111111")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(24,21,16,0.14)")}
          />
          {error && <div style={{ marginTop: 12, fontSize: 13, color: "#fd8a65" }}>{error}</div>}
          <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              onClick={() => ref.current?.close()}
              style={{
                borderRadius: 999,
                padding: "10px 16px",
                fontSize: 13,
                color: "rgba(24,21,16,0.6)",
                transition: "color 0.2s",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#181510")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(24,21,16,0.6)")}
            >
              Cancel
            </button>
            <button
              disabled={busy || !name.trim()}
              onClick={submit}
              style={{
                borderRadius: 999,
                background: busy || !name.trim() ? "rgba(17,17,17,0.5)" : "#111111",
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                color: "#ffffff",
                transition: "background 0.2s",
                border: "none",
                cursor: busy || !name.trim() ? "not-allowed" : "pointer",
                fontFamily: "var(--font-space-grotesk, system-ui, sans-serif)",
              }}
              onMouseEnter={(e) => {
                if (!busy && name.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#222222"
                }
              }}
              onMouseLeave={(e) => {
                if (!busy && name.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#111111"
                }
              }}
            >
              {busy ? "…" : "Create Space →"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
