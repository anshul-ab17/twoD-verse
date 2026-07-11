/**
 * PixiWorld.tsx
 * Client-side React wrapper that creates a PixiJS v8 Application and mounts
 * the 2D spatial world into a full-viewport canvas.
 */
"use client"

import { useEffect, useRef, useState } from "react"
import type { Application, Container } from "pixi.js"
import type { WorldScene } from "./world/WorldScene"

type Theme = "office" | "cafe" | "zen" | "library" | "lounge"

interface Props {
  theme?: Theme
  verseId?: string
  userName?: string
}

export function PixiWorld({ theme = "office", verseId, userName = "You" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const sceneRef = useRef<WorldScene | null>(null)
  const [activeRoom, setActiveRoom] = useState<string>("Hallway")
  const [xpPopup, setXpPopup] = useState<string>("")
  const [nearbyName, setNearbyName] = useState<string>("")
  const [currentTheme, setCurrentTheme] = useState<Theme>(theme)

  useEffect(() => {
    let destroyed = false

    async function init() {
      if (!canvasRef.current) return

      const { Application } = await import("pixi.js")
      const { WorldScene } = await import("./world/WorldScene")

      const app = new Application()
      await app.init({
        canvas: canvasRef.current,
        resizeTo: canvasRef.current.parentElement ?? window,
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
        antialias: false,
        preference: "webgl",
        background: "#1a1a2e",
      })

      if (destroyed) { app.destroy(true); return }

      appRef.current = app

      const scene = new WorldScene(app, currentTheme, userName, {
        onRoomChange: setActiveRoom,
        onXP: (msg) => { setXpPopup(msg); setTimeout(() => setXpPopup(""), 2200) },
        onNearby: setNearbyName,
      })

      await scene.init()
      if (destroyed) { scene.destroy(); app.destroy(true); return }

      sceneRef.current = scene
    }

    init().catch(console.error)

    return () => {
      destroyed = true
      sceneRef.current?.destroy()
      appRef.current?.destroy(true)
      sceneRef.current = null
      appRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Theme hot-swap
  useEffect(() => {
    sceneRef.current?.switchTheme(currentTheme)
  }, [currentTheme])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#1a1a2e", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

      {/* Room label HUD */}
      <div style={{
        position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        color: "#ffffff", padding: "6px 18px", borderRadius: 999,
        fontSize: 13, fontWeight: 600, fontFamily: "system-ui, sans-serif",
        letterSpacing: "0.04em", pointerEvents: "none",
        border: "1px solid rgba(255,255,255,0.12)"
      }}>
        📍 {activeRoom}
      </div>

      {/* Nearby person toast */}
      {nearbyName && (
        <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: "rgba(16,16,32,0.85)", backdropFilter: "blur(8px)",
          color: "#9ea8f8", padding: "8px 20px", borderRadius: 999,
          fontSize: 13, fontWeight: 500, fontFamily: "system-ui, sans-serif",
          border: "1px solid rgba(100,100,220,0.25)", pointerEvents: "none",
          animation: "fadeInUp 0.3s ease"
        }}>
          🔊 {nearbyName} is nearby
        </div>
      )}

      {/* XP popup */}
      {xpPopup && (
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translateX(-50%)",
          background: "rgba(80,220,100,0.15)", border: "1px solid rgba(80,220,100,0.4)",
          backdropFilter: "blur(6px)", color: "#7ee787",
          padding: "10px 24px", borderRadius: 999,
          fontSize: 15, fontWeight: 700, fontFamily: "system-ui, sans-serif",
          pointerEvents: "none", animation: "xpFloat 2.2s ease forwards"
        }}>
          {xpPopup}
        </div>
      )}

      {/* Theme switcher */}
      <div style={{
        position: "absolute", bottom: 16, right: 16, display: "flex", gap: 6, flexWrap: "wrap"
      }}>
        {(["office", "cafe", "zen", "library", "lounge"] as Theme[]).map(t => (
          <button
            key={t}
            onClick={() => setCurrentTheme(t)}
            style={{
              background: currentTheme === t ? "rgba(123,123,248,0.9)" : "rgba(0,0,0,0.55)",
              border: currentTheme === t ? "1.5px solid #7b7bf8" : "1.5px solid rgba(255,255,255,0.12)",
              color: "#fff", padding: "5px 12px", borderRadius: 999, fontSize: 11,
              fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif",
              textTransform: "capitalize", backdropFilter: "blur(6px)",
              transition: "all 0.2s"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 16, left: 16,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
        color: "rgba(255,255,255,0.5)", padding: "6px 12px", borderRadius: 8,
        fontSize: 11, fontFamily: "monospace", pointerEvents: "none",
        border: "1px solid rgba(255,255,255,0.08)"
      }}>
        WASD / ↑↓←→ move · SPACE greet
      </div>

      <style>{`
        @keyframes xpFloat {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
