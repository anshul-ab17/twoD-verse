"use client"

import { useEffect, useState, useRef } from "react"

const WORD = "TwoD VERSE"

type Phase = "loading" | "exit" | "done"

export function Loader({ onDone, onPhaseChange }: { onDone: () => void, onPhaseChange?: (phase: "loading" | "exit" | "done") => void }) {
  const [shown, setShown] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")
  const hasStarted = useRef(false)

  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true

    document.documentElement.style.overflow = "hidden"
    if (onPhaseChange) onPhaseChange("loading")

    let i = 0
    const iv = setInterval(() => {
      i++
      setShown(i)
      if (i >= WORD.length) {
        clearInterval(iv)
        const t1 = setTimeout(() => {
          setPhase("exit")
          if (onPhaseChange) onPhaseChange("exit")
          const t2 = setTimeout(() => {
            document.documentElement.style.overflow = ""
            setPhase("done")
            if (onPhaseChange) onPhaseChange("done")
            onDone()
          }, 950)
        }, 600)
      }
    }, 110)

    return () => {
      clearInterval(iv)
      document.documentElement.style.overflow = ""
    }
  }, [onDone, onPhaseChange])

  if (phase === "done") return null

  const revealed = phase === "exit"

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        pointerEvents: revealed ? "none" : "auto",
      }}
    >
      {/* fading white overlay */}
      <div
        style={{
          position: "absolute", inset: 0, background: "#ffffff",
          opacity: revealed ? 0 : 1,
          transition: "opacity 0.7s ease 0.25s",
        }}
      />

      {/* "TwoD VERSE" — flies from center to nav-left on exit */}
      <div
        style={{
          position: "absolute",
          left: "4.5vw",
          top: revealed ? "33px" : "50%",
          transform: revealed ? "translateY(0%)" : "translateY(-50%)",
          fontFamily: "'Anybody', 'Arial Black', sans-serif",
          fontWeight: 900,
          fontStretch: "140%",
          fontSize: revealed ? "19px" : "clamp(36px, 5.8vw, 100px)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          display: "flex",
          color: "#111111",
          transition: "top 0.9s cubic-bezier(0.76,0,0.24,1), transform 0.9s cubic-bezier(0.76,0,0.24,1), font-size 0.9s cubic-bezier(0.76,0,0.24,1)",
        }}
      >
        {WORD.split("").map((ch, idx) => (
          <span
            key={idx}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: idx < shown ? 1 : 0,
              transform: `translateY(${idx < shown ? 0 : 26}px)`,
              transition: "opacity 0.45s ease, transform 0.45s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {ch}
          </span>
        ))}
      </div>

      {/* dot → "SIGN IN" pill */}
      <div
        style={{
          position: "absolute",
          right: "4.5vw",
          top: revealed ? "22px" : "50%",
          transform: revealed ? "translateY(0%)" : "translateY(-50%)",
          width: revealed ? "116px" : "clamp(22px, 2.2vw, 36px)",
          height: revealed ? "39px" : "clamp(22px, 2.2vw, 36px)",
          borderRadius: "999px",
          background: shown >= WORD.length ? "#111111" : "#C7C5C1",
          opacity: shown === 0 ? 0 : 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxSizing: "border-box",
          animation: revealed ? "none" : "dotPulse 1.1s ease-in-out infinite",
          transition: [
            "top 0.9s cubic-bezier(0.76,0,0.24,1)",
            "transform 0.9s cubic-bezier(0.76,0,0.24,1)",
            "width 0.9s cubic-bezier(0.76,0,0.24,1)",
            "height 0.9s cubic-bezier(0.76,0,0.24,1)",
            "background 0.6s ease",
            "opacity 0.6s ease",
          ].join(", "),
        }}
      >
        <span
          style={{
            fontSize: "13px", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "#ffffff", whiteSpace: "nowrap",
            opacity: revealed ? 1 : 0,
            transition: "opacity 0.35s ease 0.45s",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          SIGN IN
        </span>
      </div>
    </div>
  )
}
