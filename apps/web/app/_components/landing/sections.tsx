"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getAccessToken } from "../../../lib/auth"

function TwoDVerseLogo({ className = "text-black" }: { className?: string }) {
  return (
    <div className="relative w-7 h-7 flex items-center justify-center select-none">
      <svg viewBox="0 0 24 24" className={`w-full h-full fill-none stroke-current stroke-[2.5] ${className}`}>
        <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="2.5" />
        <circle cx="12" cy="12" r="2.5" className="fill-current" />
        <line x1="12" y1="3" x2="12" y2="21" className="opacity-20" />
        <line x1="3" y1="12" x2="21" y2="12" className="opacity-20" />
      </svg>
    </div>
  )
}

const MASONRY_FEATURES = [
  {
    id: "01",
    tag: "SPATIAL_INFRA // ATTENUATION",
    title: "Proximity Audio Pipeline",
    desc: "Linear distance attenuation modeled in real-time. Sound volumes scale logarithmically as avatars move across coordinates, simulating physical desks.",
    color: "#aadcff", // Light Blue
    mediaType: "audio-grid",
  },
  {
    id: "02",
    tag: "RTC_COMMUNICATIONS // SECURE",
    title: "Direct Peer Media Streaming",
    desc: "Low-latency WebRTC streams bound dynamically to coordinate zones, minimizing network payload overhead and eliminating server-side relay delays.",
    color: "#e7d8ee", // Malva
    mediaType: "webrtc-stream",
  },
  {
    id: "03",
    tag: "AGENTIC_INFERENCE // SUMMARIZE",
    title: "Autopilot Zone Summarizer",
    desc: "Natural language processing listening to active meeting zone logs to compile automated action items and track milestones in real-time.",
    color: "#ffff8c", // Yellow
    mediaType: "ai-logs",
  }
]

const SERVICES = [
  "Spatial Audio Pipeline",
  "Peer-to-Peer WebRTC",
  "Agentic Zone Inference",
  "Multipurpose Game HUD",
  "Coordinate Telemetry API",
]

const STEPS = [
  { n: "01 / STEP", title: "Initialize Sandbox", text: "Select an architectural layout profile: standard headquarters, hackathon floor, or custom coordinate map.", color: "#efe9dd" },
  { n: "02 / STEP", title: "Establish Peers", text: "Generate tokenized gateway links. Access is instant via standard browsers with no dependency installs.", color: "#d9ebd4" },
  { n: "03 / STEP", title: "Coordinate Drop-in", text: "Avatars initialize on the 2D grid. Proximity circles activate spatial audio feeds automatically.", color: "#d8ebff" },
]

interface Entity {
  x: number
  y: number
  radius: number
  color: string
  name: string
  role: string
}

// Canvas-based interactive mockup that simulates a Gather.town spatial video office.
// Styled strictly with Afternow's project surface fills (orange, yellow, malva, deep blue, light blue).
function TelemetryRadarPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverText, setHoverText] = useState("PEER COORDINATES: IDLE | CURSOR OUTSIDE GRAPH")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = 960)
    let height = (canvas.height = 540)

    const handleResize = () => {
      if (containerRef.current && canvas) {
        const rect = containerRef.current.getBoundingClientRect()
        width = canvas.width = rect.width * 2
        height = canvas.height = rect.width * (540 / 960) * 2
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()

    // Using validated Afternow colors for entities
    const you = { x: width / 2, y: height / 2, radius: 10, targetX: width / 2, targetY: height / 2, speed: 0.08, color: "#fd8a65", name: "YOU", role: "GUEST_PEER" }
    const alice = { x: width * 0.25, y: height * 0.35, radius: 8, angle: 0, speed: 0.012, color: "#aadcff", name: "ALICE", role: "UI_DESIGNER" }
    const bob = { x: width * 0.75, y: height * 0.65, radius: 8, angle: Math.PI, speed: 0.008, color: "#e7d8ee", name: "BOB", role: "ENGINEER" }

    let mouseActive = false
    let tick = 0

    const drawAudioBars = (x: number, y: number, color: string) => {
      const bars = 5
      ctx.fillStyle = color
      for (let i = 0; i < bars; i++) {
        const barH = 4 + Math.sin(tick * 0.25 + i) * 12
        ctx.fillRect(x - 12 + i * 6, y - 50, 4, barH)
      }
    }

    const draw = () => {
      tick++
      ctx.clearRect(0, 0, width, height)

      // 1. Draw Technical Grid
      ctx.strokeStyle = "#dadbd7"
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      ctx.fillStyle = "#77786d"
      ctx.font = "8px var(--font-messina-sans-mono), monospace"
      for (let x = 80; x < width; x += 160) {
        ctx.fillText(`X:${x}`, x, 12)
      }
      for (let y = 80; y < height; y += 120) {
        ctx.fillText(`Y:${y}`, 6, y)
      }

      // 2. Draw Office Spatial Zones
      const mZone = { x: width * 0.35, y: height * 0.2, w: width * 0.3, h: height * 0.6 }
      ctx.fillStyle = "rgba(39, 98, 132, 0.03)"
      ctx.fillRect(mZone.x, mZone.y, mZone.w, mZone.h)
      ctx.strokeStyle = "#276284"
      ctx.lineWidth = 1.5
      ctx.strokeRect(mZone.x, mZone.y, mZone.w, mZone.h)
      
      ctx.fillStyle = "#276284"
      ctx.font = "bold 9px var(--font-messina-sans-mono), monospace"
      ctx.fillText("// ZONE_01_SECURE_MEET", mZone.x + 15, mZone.y + 25)
      ctx.fillStyle = "#77786d"
      ctx.fillText(`BOUNDS: [${Math.floor(mZone.x)}, ${Math.floor(mZone.y)}, ${Math.floor(mZone.w)}x${Math.floor(mZone.h)}]`, mZone.x + 15, mZone.y + 40)
      
      const deskL = { x: width * 0.08, y: height * 0.55, w: 160, h: 100 }
      ctx.fillStyle = "#f0f0ef"
      ctx.fillRect(deskL.x, deskL.y, deskL.w, deskL.h)
      ctx.strokeStyle = "#dadbd7"
      ctx.strokeRect(deskL.x, deskL.y, deskL.w, deskL.h)
      ctx.fillStyle = "#000000"
      ctx.fillText("// ZONE_02_FOCUS_DESK", deskL.x + 12, deskL.y + 22)
      ctx.fillStyle = "#77786d"
      ctx.fillText("PEER_LIMIT: 2", deskL.x + 12, deskL.y + 36)

      if (mouseActive) {
        you.x += (you.targetX - you.x) * you.speed
        you.y += (you.targetY - you.y) * you.speed
      } else {
        you.x += Math.sin(tick * 0.015) * 0.3
        you.y += Math.cos(tick * 0.02) * 0.3
      }

      alice.angle += alice.speed
      alice.x = (width * 0.25) + Math.cos(alice.angle) * 70
      alice.y = (height * 0.4) + Math.sin(alice.angle * 1.3) * 40

      bob.angle += bob.speed
      bob.x = (width * 0.65) + Math.sin(bob.angle) * 100
      bob.y = (height * 0.5) + Math.cos(bob.angle) * 50

      const distToAlice = Math.hypot(you.x - alice.x, you.y - alice.y)
      const distToBob = Math.hypot(you.x - bob.x, you.y - bob.y)
      const distAliceBob = Math.hypot(alice.x - bob.x, alice.y - bob.y)

      const activeConns: string[] = []

      ctx.lineWidth = 1.5
      if (distToAlice < 200) {
        ctx.strokeStyle = "#000000"
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(you.x, you.y)
        ctx.lineTo(alice.x, alice.y)
        ctx.stroke()
        ctx.setLineDash([])
        activeConns.push("ALICE")
      }
      if (distToBob < 200) {
        ctx.strokeStyle = "#000000"
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(you.x, you.y)
        ctx.lineTo(bob.x, bob.y)
        ctx.stroke()
        ctx.setLineDash([])
        activeConns.push("BOB")
      }
      if (distAliceBob < 200) {
        ctx.strokeStyle = "#dadbd7"
        ctx.beginPath()
        ctx.moveTo(alice.x, alice.y)
        ctx.lineTo(bob.x, bob.y)
        ctx.stroke()
      }

      if (activeConns.length > 0) {
        setHoverText(`TELEMETRY: ACTIVE PEER LINK established with ${activeConns.join(" & ")} | LATENCY: 18ms`)
      } else {
        setHoverText(mouseActive ? `PEER COORDINATES: [X: ${Math.floor(you.x)}, Y: ${Math.floor(you.y)}] | APPROACH OTHERS FOR PROXIMITY LINK` : "PEER COORDINATES: IDLE | CURSOR OUTSIDE GRAPH")
      }

      const drawProximityRing = (ent: any) => {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(ent.x, ent.y, 100, 0, Math.PI * 2)
        ctx.stroke()
      }
      drawProximityRing(you)

      const drawAvatar = (ent: any, isActive: boolean) => {
        ctx.strokeStyle = ent.color
        ctx.lineWidth = 2
        ctx.strokeRect(ent.x - 12, ent.y - 12, 24, 24)
        
        if (isActive) {
          ctx.fillStyle = ent.color
          ctx.fillRect(ent.x - 4, ent.y - 4, 8, 8)
        } else {
          ctx.fillStyle = "#000000"
          ctx.fillRect(ent.x - 2, ent.y - 2, 4, 4)
        }

        ctx.beginPath()
        ctx.moveTo(ent.x - 16, ent.y)
        ctx.lineTo(ent.x + 16, ent.y)
        ctx.moveTo(ent.x, ent.y - 16)
        ctx.lineTo(ent.x, ent.y + 16)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)"
        ctx.stroke()

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(ent.x - 55, ent.y + 20, 110, 24)
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1
        ctx.strokeRect(ent.x - 55, ent.y + 20, 110, 24)

        ctx.fillStyle = "#000000"
        ctx.font = "bold 8px var(--font-messina-sans-mono), monospace"
        ctx.fillText(ent.name, ent.x - 50, ent.y + 31)
        ctx.fillStyle = "#77786d"
        ctx.fillText(ent.role, ent.x - 50, ent.y + 40)
      }

      drawAvatar(alice, distToAlice < 200 || distAliceBob < 200)
      drawAvatar(bob, distToBob < 200 || distAliceBob < 200)
      drawAvatar(you, distToAlice < 200 || distToBob < 200)

      const drawVideoFeed = (ent: any, offset: number, faceSeed: number) => {
        const vX = ent.x
        const vY = ent.y - 95
        const vW = 100
        const vH = 55

        ctx.fillStyle = "#ffffff"
        ctx.fillRect(vX - vW / 2, vY, vW, vH)
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 1.5
        ctx.strokeRect(vX - vW / 2, vY, vW, vH)
        
        ctx.fillStyle = ent.color
        ctx.fillRect(vX - vW / 2 - 1, vY - 1, 6, 6)
        ctx.fillRect(vX + vW / 2 - 5, vY - 1, 6, 6)

        ctx.strokeStyle = "rgba(0,0,0,0.15)"
        ctx.beginPath()
        for (let i = 0; i < vW; i += 4) {
          const lH = 4 + Math.sin(tick * 0.1 + i * 0.2 + faceSeed) * 12
          ctx.moveTo(vX - vW / 2 + i, vY + vH / 2 - lH / 2)
          ctx.lineTo(vX - vW / 2 + i, vY + vH / 2 + lH / 2)
        }
        ctx.stroke()

        ctx.fillStyle = "#276284"
        ctx.font = "bold 7px var(--font-messina-sans-mono), monospace"
        ctx.fillText("LIVE_STREAM", vX - vW / 2 + 6, vY + 12)

        drawAudioBars(vX, vY + vH + 15, ent.color)
      }

      if (distToAlice < 200) {
        drawVideoFeed(alice, 0, 1)
        drawVideoFeed(you, 0, 2)
      }
      if (distToBob < 200) {
        drawVideoFeed(bob, 0, 3)
        if (distToAlice >= 200) {
          drawVideoFeed(you, 0, 2)
        }
      }

      if (tick % 600 < 200 && distToAlice < 200) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(alice.x + 20, alice.y - 30, 210, 34)
        ctx.strokeStyle = "#000000"
        ctx.strokeRect(alice.x + 20, alice.y - 30, 210, 34)
        ctx.fillStyle = "#276284"
        ctx.font = "bold 9px var(--font-messina-sans-mono), monospace"
        ctx.fillText("ALICE:", alice.x + 28, alice.y - 18)
        ctx.fillStyle = "#000000"
        ctx.font = "9px var(--font-messina-sans), sans-serif"
        ctx.fillText("Reviewing design variables.", alice.x + 68, alice.y - 18)
      } else if (tick % 600 >= 300 && tick % 600 < 500 && distToBob < 200) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(bob.x - 230, bob.y - 30, 210, 34)
        ctx.strokeStyle = "#000000"
        ctx.strokeRect(bob.x - 230, bob.y - 30, 210, 34)
        ctx.fillStyle = "#fd8a65"
        ctx.font = "bold 9px var(--font-messina-sans-mono), monospace"
        ctx.fillText("BOB:", bob.x - 222, bob.y - 18)
        ctx.fillStyle = "#000000"
        ctx.font = "9px var(--font-messina-sans), sans-serif"
        ctx.fillText("Inference stream initialized.", bob.x - 188, bob.y - 18)
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      you.targetX = ((e.clientX - rect.left) / rect.width) * width
      you.targetY = ((e.clientY - rect.top) / rect.height) * height
      mouseActive = true
    }

    const handleMouseLeave = () => {
      mouseActive = false
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseleave", handleMouseLeave)

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove)
        canvas.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#f9f9f8] select-none">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-[100px] bg-[#f0f0ef] border border-black px-3.5 py-1.5 text-[9px] font-mono tracking-widest text-black">
        <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
        TELEMETRY_RADAR_MAP_v2.0
      </div>
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      <div className="absolute bottom-16 left-4 right-4 z-10 flex justify-between items-center bg-white border border-black px-4 py-3 rounded-[12px] text-[9.5px] font-mono text-black">
        <span className="tracking-tight">{hoverText}</span>
        <span className="text-[#77786d] text-[8px] tracking-wide">GRID: 80x80 · STATUS: PERSISTENT</span>
      </div>
    </div>
  )
}

export function GamifiedOfficeSpacePreview() {
  const [activeTheme, setActiveTheme] = useState<"tech" | "zen" | "library" | "cafe">("tech")
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  
  const [techPos, setTechPos] = useState({ x: 330, y: 270 })
  const [zenPos, setZenPos] = useState({ x: 328, y: 236 })
  const [libPos, setLibPos] = useState({ x: 330, y: 330 })
  const [cafePos, setCafePos] = useState({ x: 196, y: 200 })

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentW = containerRef.current.clientWidth
        const parentH = containerRef.current.clientHeight
        const scaleX = parentW / 720
        const scaleY = (parentH - 90) / 490
        const newScale = Math.min(scaleX, scaleY, 1.0)
        setScale(newScale)
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()
    const timer = setTimeout(handleResize, 100)
    return () => {
      window.removeEventListener("resize", handleResize)
      clearTimeout(timer)
    }
  }, [activeTheme])

  const handleFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = Math.round((e.clientX - rect.left) / scale)
    const clickY = Math.round((e.clientY - rect.top) / scale)
    
    if (clickY > 44 && clickY < 460 && clickX > 20 && clickX < 700) {
      if (activeTheme === "tech") setTechPos({ x: clickX - 20, y: clickY - 20 })
      else if (activeTheme === "zen") setZenPos({ x: clickX - 20, y: clickY - 20 })
      else if (activeTheme === "library") setLibPos({ x: clickX - 18, y: clickY - 20 })
      else if (activeTheme === "cafe") setCafePos({ x: clickX - 20, y: clickY - 20 })
    }
  }

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-[#17181c] select-none text-white font-mono p-4 items-center justify-between border-[3px] border-black rounded-none relative overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-zinc-800 z-10">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#7c7c82]">/ PLAYABLE_MAP_PREVIEW_v2</span>
        </div>
        
        {/* Theme Tabs */}
        <div className="flex flex-wrap gap-1">
          {(["tech", "zen", "library", "cafe"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTheme(t)}
              className={`px-3 py-1.5 text-[9px] font-bold border-2 border-black rounded-none transition-all cursor-pointer ${
                activeTheme === t
                  ? "bg-[#fd8a65] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-y-[-1px]"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border-zinc-700"
              }`}
            >
              {t === "tech" && "1a MODERN TECH HQ"}
              {t === "zen" && "1b ZEN GARDEN"}
              {t === "library" && "1c LIBRARY LOFT"}
              {t === "cafe" && "1d SUNNY CAFE"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Playable Map Container */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden py-2">
        <div 
          onClick={handleFloorClick}
          className="relative shrink-0 overflow-hidden cursor-crosshair border-2 border-black/30 shadow-2xl transition-all duration-300"
          style={{
            width: "720px",
            height: "490px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            imageRendering: "pixelated"
          }}
        >
          {activeTheme === "tech" && (
            <div className="w-full h-full relative" style={{ backgroundImage: "url('/assets/tiles/floor_gray.png')", backgroundSize: "48px 48px" }}>
              <div className="absolute left-0 top-0 w-[720px] h-[44px]" style={{ backgroundImage: "url('/assets/tiles/wall_gray.png')", backgroundSize: "48px 44px" }} />
              <div className="absolute left-0 top-[44px] w-[336px] h-[212px]" style={{ backgroundImage: "url('/assets/tiles/carpet_blue.png')", backgroundSize: "48px 48px", boxShadow: "inset -4px -4px 0 rgba(30,35,48,.55)" }} />
              <div className="absolute left-[96px] top-[52px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#333] rounded-full shadow-md z-10">Engineering · +10 XP/hr</div>
              <div className="absolute left-[384px] top-[44px] w-[336px] h-[196px]" style={{ backgroundImage: "url('/assets/tiles/floor_beige.png')", backgroundSize: "48px 48px", boxShadow: "inset 4px -4px 0 rgba(30,35,48,.55)" }} />
              <div className="absolute left-[492px] top-[52px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#333] rounded-full shadow-md z-10">War Room</div>
              <div className="absolute left-[448px] top-[308px] w-[272px] h-[182px]" style={{ backgroundImage: "url('/assets/tiles/floor_cream.png')", backgroundSize: "48px 48px", boxShadow: "inset 4px 4px 0 rgba(30,35,48,.55)" }} />
              <div className="absolute left-[470px] top-[316px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#333] rounded-full shadow-md z-10">Kitchen · coffee buff ☕ x2 focus</div>
              <div className="absolute left-[64px] top-[446px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#333] rounded-full shadow-md z-10">Lounge · daily trivia</div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 150, top: 236, width: 64 }}>
                <div className="bg-[#1e2330]/90 text-[#7ee787] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Nami · Lv 9</div>
                <img src="/assets/chars/f10.png" alt="" style={{ width: 40, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 600, top: 368, width: 64 }}>
                <div className="bg-[#1e2330]/90 text-[#7ee787] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Sanji · Lv 15</div>
                <img src="/assets/chars/f12.png" alt="" style={{ width: 36, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute flex flex-col items-center gap-0.5 transition-all duration-500 ease-out z-30" style={{ left: techPos.x, top: techPos.y, width: 64 }}>
                <div className="bg-[#1e2330] text-white border border-black text-[9px] px-2.5 py-0.5 rounded font-sans font-semibold whitespace-nowrap animate-[bob_2.2s_infinite]">Standup in 5! 🔔</div>
                <div className="bg-[#1e2330]/90 text-[#7ee787] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Luffy (You)</div>
                <img src="/assets/chars/f00.png" alt="" style={{ width: 38, imageRendering: "pixelated" }} />
              </div>
            </div>
          )}
          {activeTheme === "zen" && (
            <div className="w-full h-full relative" style={{ backgroundImage: "url('/assets/tiles/wood_honey.png')", backgroundSize: "48px 48px" }}>
              <div className="absolute left-0 top-0 w-[720px] h-[44px]" style={{ backgroundImage: "url('/assets/tiles/wall_tan.png')", backgroundSize: "48px 44px" }} />
              <div className="absolute left-[216px] top-[140px] w-[288px] h-[220px] rounded-[14px]" style={{ backgroundImage: "url('/assets/tiles/carpet_sage.png')", backgroundSize: "48px 48px", border: "4px solid rgba(90,110,80,.5)" }} />
              <div className="absolute left-[242px] top-[366px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#4a5d3a] rounded-full shadow-md z-10">🧘 Garden · 25-min focus = +1 bonsai leaf</div>
              <div className="absolute left-[52px] top-[462px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#4a5d3a] rounded-full shadow-md z-10">Tea corner 🍵</div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 130, top: 340, width: 64 }}>
                <div className="bg-[#3d4a33]/90 text-[#c9e4a5] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Zoro · meditating</div>
                <img src="/assets/chars/f04.png" alt="" style={{ width: 38, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute flex flex-col items-center gap-0.5 transition-all duration-500 ease-out z-30" style={{ left: zenPos.x, top: zenPos.y, width: 64 }}>
                <div className="bg-[#3d4a33] text-white border border-black text-[9px] px-2.5 py-0.5 rounded font-sans font-semibold whitespace-nowrap animate-[bob_2.8s_infinite]">Zen mode 🔕 47-day streak</div>
                <div className="bg-[#3d4a33]/90 text-[#c9e4a5] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Robin (You)</div>
                <img src="/assets/chars/f18.png" alt="" style={{ width: 40, imageRendering: "pixelated" }} />
              </div>
            </div>
          )}
          {activeTheme === "library" && (
            <div className="w-full h-full relative" style={{ backgroundImage: "url('/assets/tiles/wood_dark.png')", backgroundSize: "48px 48px" }}>
              <div className="absolute left-0 top-0 w-[720px] h-[44px]" style={{ backgroundImage: "url('/assets/tiles/wall_mauve.png')", backgroundSize: "48px 44px" }} />
              <div className="absolute left-0 top-[190px] w-[340px] h-[300px]" style={{ backgroundImage: "url('/assets/tiles/carpet_red.png')", backgroundSize: "48px 48px", boxShadow: "inset -4px 0 0 rgba(25,18,16,.6)" }} />
              <div className="absolute left-[70px] top-[200px] bg-[#f4e8d8] border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#6b3030] rounded-full shadow-md z-10">📖 Quiet zone · mic auto-muted</div>
              <div className="absolute left-[420px] top-[210px] w-[300px] h-[280px]" style={{ backgroundImage: "url('/assets/tiles/floor_mauve.png')", backgroundSize: "48px 48px", boxShadow: "inset 4px 0 0 rgba(25,18,16,.6)" }} />
              <div className="absolute left-[500px] top-[218px] bg-[#f4e8d8] border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#6b3030] rounded-full shadow-md z-10">Study carrels</div>
              <div className="absolute left-[168px] top-[150px] bg-[#2a1f1a] text-[#e8c88a] border border-[#3e2f27] px-2 py-0.5 rounded font-sans font-bold text-[9px] shadow z-10">📜 Quest board · 3 new bounties</div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 60, top: 120, width: 64 }}>
                <div className="bg-[#2a1f1a]/90 text-[#e8c88a] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Usopp · Lv 7</div>
                <img src="/assets/chars/f26.png" alt="" style={{ width: 38, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute flex flex-col items-center gap-0.5 transition-all duration-500 ease-out z-30" style={{ left: libPos.x, top: libPos.y, width: 64 }}>
                <div className="bg-[#2a1f1a] text-white border border-black text-[9px] px-2.5 py-0.5 rounded font-sans font-semibold whitespace-nowrap animate-[bob_2.6s_infinite]">Shhh… 🤫</div>
                <div className="bg-[#2a1f1a]/90 text-[#e8c88a] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Brook (You)</div>
                <img src="/assets/chars/f22.png" alt="" style={{ width: 36, imageRendering: "pixelated" }} />
              </div>
            </div>
          )}
          {activeTheme === "cafe" && (
            <div className="w-full h-full relative" style={{ backgroundImage: "url('/assets/tiles/wood_light.png')", backgroundSize: "48px 48px" }}>
              <div className="absolute left-0 top-0 w-[720px] h-[44px]" style={{ backgroundImage: "url('/assets/tiles/wall_cream.png')", backgroundSize: "48px 44px" }} />
              <div className="absolute left-[490px] top-[44px] w-[230px] h-[180px]" style={{ backgroundImage: "url('/assets/tiles/floor_tan.png')", backgroundSize: "48px 48px", boxShadow: "inset 4px -4px 0 rgba(60,45,30,.4)" }} />
              <div className="absolute left-[520px] top-[186px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#7a5c20] rounded-full shadow-md z-10">☕ Barista bar · order = emote</div>
              <div className="absolute left-[36px] top-[120px] w-[400px] h-[250px] rounded-[12px]" style={{ backgroundImage: "url('/assets/tiles/carpet_gold.png')", backgroundSize: "48px 48px", border: "4px solid rgba(140,105,40,.45)" }} />
              <div className="absolute left-[140px] top-[342px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#7a5c20] rounded-full shadow-md z-10">🎲 Sit here → random coffee-chat match</div>
              <div className="absolute left-[512px] top-[396px] bg-white border border-black px-2.5 py-0.5 font-sans font-bold text-[9px] text-[#7a5c20] rounded-full shadow-md z-10">🎤 Demo Friday stage</div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 300, top: 206, width: 64 }}>
                <div className="bg-[#7a5c20]/90 text-[#ffe9b0] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Nami</div>
                <img src="/assets/chars/f08.png" alt="" style={{ width: 38, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute select-none flex flex-col items-center gap-0.5 z-20" style={{ left: 600, top: 330, width: 64 }}>
                <div className="bg-[#7a5c20]/90 text-[#ffe9b0] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Luffy · presenting</div>
                <img src="/assets/chars/f02.png" alt="" style={{ width: 40, imageRendering: "pixelated" }} />
              </div>
              <div className="absolute flex flex-col items-center gap-0.5 transition-all duration-500 ease-out z-30" style={{ left: cafePos.x, top: cafePos.y, width: 64 }}>
                <div className="bg-[#7a5c20] text-white border border-black text-[9px] px-2.5 py-0.5 rounded font-sans font-semibold whitespace-nowrap animate-[bob_2.2s_infinite]">Matched! Say hi 👋</div>
                <div className="bg-[#7a5c20]/90 text-[#ffe9b0] border border-black/35 font-bold text-[8px] font-sans px-2 py-0.5 rounded-full">● Chopper (You)</div>
                <img src="/assets/chars/f24.png" alt="" style={{ width: 40, imageRendering: "pixelated" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="w-full bg-[#111115] border border-zinc-800 p-3 flex justify-between items-center text-[9.5px] text-[#7c7c82] z-10">
        <span className="tracking-tight uppercase">
          {activeTheme === "tech" && `TELEMETRY // COORDINATES: [X: ${techPos.x}, Y: ${techPos.y}] | CLICK MAP TO MOVE LUFFY`}
          {activeTheme === "zen" && `TELEMETRY // COORDINATES: [X: ${zenPos.x}, Y: ${zenPos.y}] | CLICK MAP TO MOVE ROBIN`}
          {activeTheme === "library" && `TELEMETRY // COORDINATES: [X: ${libPos.x}, Y: ${libPos.y}] | CLICK MAP TO MOVE BROOK`}
          {activeTheme === "cafe" && `TELEMETRY // COORDINATES: [X: ${cafePos.x}, Y: ${cafePos.y}] | CLICK MAP TO MOVE CHOPPER`}
        </span>
        <span className="text-[8px] tracking-widest hidden sm:inline">SCALE: {scale.toFixed(2)}x · ACTIVE_THEME: {activeTheme.toUpperCase()}</span>
      </div>
    </div>
  )
}

function InteractiveWorldPreview() {
  return <TelemetryRadarPreview />
}

function PixelOfficeScene() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#f4f1ea",
        backgroundImage: "linear-gradient(rgba(24,21,16,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(24,21,16,0.05) 1px,transparent 1px)",
        backgroundSize: "36px 36px",
        overflow: "hidden",
      }}
    >
      {/* sprites use actual public assets */}
      <img src="/assets/furniture/office/window.png" alt="" style={{ position: "absolute", left: 56, top: 28, width: 96, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/whiteboard.png" alt="" style={{ position: "absolute", left: 420, top: 30, width: 128, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/wall_clock.png" alt="" style={{ position: "absolute", left: 640, top: 36, width: 56, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/painting.png" alt="" style={{ position: "absolute", left: 930, top: 34, width: 72, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/desk.png" alt="" style={{ position: "absolute", left: 120, top: 150, width: 170, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/pc.png" alt="" style={{ position: "absolute", left: 160, top: 96, width: 80, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/chair.png" alt="" style={{ position: "absolute", left: 300, top: 180, width: 66, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/meeting_table.png" alt="" style={{ position: "absolute", left: 480, top: 170, width: 180, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/sofa.png" alt="" style={{ position: "absolute", left: 730, top: 160, width: 140, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/floor_lamp.png" alt="" style={{ position: "absolute", left: 890, top: 130, width: 58, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/plant.png" alt="" style={{ position: "absolute", left: 1000, top: 160, width: 80, imageRendering: "pixelated" }} />
      <img src="/assets/furniture/office/water_cooler.png" alt="" style={{ position: "absolute", left: 1130, top: 150, width: 60, imageRendering: "pixelated" }} />
      {/* avatar labels */}
      <div style={{ position: "absolute", left: 390, top: 220, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div style={{ background: "#181510", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontFamily: "var(--font-space-grotesk, sans-serif)" }}>maya · in standup</div>
        <div style={{ width: 26, height: 26, background: "#c66a2e", border: "2px solid #181510", borderRadius: 6 }} />
      </div>
      <div style={{ position: "absolute", left: 820, top: 210, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <div style={{ background: "#181510", color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 6, fontFamily: "var(--font-space-grotesk, sans-serif)" }}>dev · afk</div>
        <div style={{ width: 26, height: 26, background: "#3e9b4f", border: "2px solid #181510", borderRadius: 6 }} />
      </div>
    </div>
  )
}

export function Hero({ phase = "done" }: { phase?: "loading" | "exit" | "done" }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [e, setE] = useState(0) // scroll progress
  const [vh, setVh] = useState(800)

  useEffect(() => {
    setVh(window.innerHeight)
    const handleResize = () => setVh(window.innerHeight)
    window.addEventListener("resize", handleResize)

    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const scrollRange = 1.55 * window.innerHeight
      const scrolled = -rect.top
      const raw = Math.max(0, Math.min(1, scrolled / scrollRange))
      
      // ease in-out cubic
      const ease = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2
      setE(ease)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const revealed = phase === "exit" || phase === "done"
  const heroOpacity = revealed ? 1 : 0
  const heroY = revealed ? 0 : 46

  // Calculate values
  const imgW = (26 + 67 * e) + "vw"
  const imgH = (32 + 52 * e) + "vh"
  const frameOuterR = 16 + 10 * e // in px
  const headlineOpacity = revealed ? Math.max(0, 1 - e * 2.4) : 0
  const headlineY = e * 70

  return (
    <section ref={containerRef} style={{ height: "260vh", position: "relative" }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "#ffffff" }}>
        
        {/* expanding media frame */}
        <div 
          style={{ 
            position: "relative", 
            width: imgW, 
            height: imgH,
            opacity: heroOpacity,
            zIndex: 10,
            transform: `translateY(${heroY}px)`,
            transition: "opacity 0.8s ease 0.35s, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.35s, width 0.05s ease-out, height 0.05s ease-out"
          }}
        >
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", border: "1px solid rgba(24,21,16,0.12)", borderRadius: `${frameOuterR}px`, background: "#ffffff", boxShadow: "0 20px 40px rgba(0,0,0,0.06)", transition: "border-radius 0.05s ease-out" }}>
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <InteractiveWorldPreview />
            </div>
          </div>
        </div>

        {/* headline */}
        <h1 
          style={{ 
            position: "absolute", 
            left: "4.5vw", 
            bottom: "6vh", 
            margin: 0, 
            maxWidth: "38vw", 
            fontWeight: 400, 
            fontSize: "clamp(24px, 2.8vw, 42px)", 
            lineHeight: 1.15, 
            letterSpacing: "-0.02em", 
            color: "#111111",
            fontFamily: "var(--font-space-grotesk, sans-serif)",
            opacity: headlineOpacity, 
            zIndex: 1,
            transform: `translateY(${headlineY}px)`,
            transition: "opacity 0.1s ease-out, transform 0.1s ease-out"
          }}
        >
          Build living virtual workspaces where teams meet and collaborate with real‑time spatial presence.
        </h1>

        {/* scroll cue */}
        <div style={{ position: "absolute", right: "4.5vw", bottom: "5vh", display: "flex", alignItems: "center", gap: 10, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#111111", opacity: headlineOpacity, zIndex: 1, transition: "opacity 0.1s ease-out" }}>
          <span style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}>Scroll</span>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#111111" }}></span>
        </div>

      </div>
    </section>
  )
}

export function SlideToExploreButton() {
  const router = useRouter()
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  const maxDrag = 186 // Travel distance: 240px button width - 40px circle diameter - 8px padding = 192px max. Constrained to 186px for visual padding.

  const handleStart = (clientX: number) => {
    setIsDragging(true)
    startXRef.current = clientX - dragOffset
  }

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const offset = Math.max(0, Math.min(186, clientX - startXRef.current))
    setDragOffset(offset)
  }, [isDragging])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragOffset > 145) {
      setDragOffset(186)
      triggerRedirect()
    } else {
      setDragOffset(0)
    }
  }, [isDragging, dragOffset])

  const triggerRedirect = () => {
    const signedIn = !!getAccessToken()
    router.push(signedIn ? "/verse" : "/signin")
  }

  const handleClick = (e: React.MouseEvent) => {
    if (dragOffset < 10) {
      triggerRedirect()
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const onPointerMove = (e: PointerEvent) => {
      handleMove(e.clientX)
    }
    const onPointerUp = () => {
      handleEnd()
    }

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
    }
  }, [isDragging, handleMove, handleEnd])

  return (
    <div 
      ref={buttonRef}
      onClick={handleClick}
      style={{
        position: "relative",
        width: "240px",
        height: "48px",
        borderRadius: "24px",
        backgroundColor: "#111111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        userSelect: "none",
        overflow: "hidden",
        boxShadow: "0 4px 14px rgba(17, 17, 17, 0.4)",
        transition: "background-color 0.2s ease"
      }}
      className="group hover:bg-zinc-800"
    >
      <span 
        style={{
          color: "#ffffff",
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "var(--font-space-grotesk, sans-serif)",
          opacity: Math.max(0.2, 1 - (dragOffset / 140)),
          transition: "opacity 0.15s ease",
          pointerEvents: "none"
        }}
      >
        Explore the space
      </span>

      <div
        onPointerDown={(e) => {
          e.stopPropagation()
          handleStart(e.clientX)
        }}
        style={{
          position: "absolute",
          left: "4px",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
          transform: `translateX(${dragOffset}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          touchAction: "none"
        }}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#111111] stroke-[3.5]" style={{ transform: "translateX(0.5px)" }}>
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// Staggered masonry client/stack logo reel
export function ClientLogoReel() {
  const logos = [
    "MONOREPO",
    "NEXT.JS",
    "EXPRESS",
    "BUN",
    "WEBRTC",
    "COLYSEUS.JS",
    "TYPESCRIPT",
    "GODOT",
  ]
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos]

  return (
    <section className="bg-white py-16 border-t border-black/10 overflow-hidden relative">
      <style>{`
        @keyframes marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee-right {
          display: flex;
          width: max-content;
          animation: marquee-right 20s linear infinite;
        }
      `}</style>
      <div className="w-full relative flex overflow-x-hidden">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-right flex gap-16 py-2 opacity-40 hover:opacity-85 transition-opacity duration-300 select-none">
          {duplicatedLogos.map((l, index) => (
            <div
              key={`${l}-${index}`}
              className="text-[14px] font-mono tracking-[0.2em] font-bold text-black flex items-center gap-3"
            >
              <span>{l}</span>
              <span className="text-[#dadbd7] text-[10px]">·</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProximityAudioVisualizer() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#aadcff]/30 overflow-hidden select-none">
      {/* Grid Coordinates Overlay */}
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }} />
      
      {/* Central User Node */}
      <div className="absolute z-10 flex flex-col items-center gap-1.5">
        <div className="h-7 w-7 border-2 border-black bg-white flex items-center justify-center font-mono text-[8px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          YOU
        </div>
      </div>
      
      {/* Proximity Limit Boundary Ring */}
      <div className="absolute h-32 w-32 rounded-full border-2 border-dashed border-black/20 animate-[pulse-ring_3s_infinite_ease-in-out]" />
      
      {/* Orbiting Peer Node */}
      <div className="absolute z-10 flex flex-col items-center gap-1.5 animate-[orbit_8s_infinite_ease-in-out]">
        <div className="h-6 w-6 border-2 border-black bg-[#fd8a65] flex items-center justify-center font-mono text-[7px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          PEER
        </div>
      </div>

      {/* Proximity Soundwave Equalizer (Bottom-Right) */}
      <div className="absolute bottom-5 right-6 flex gap-1 items-end h-8">
        {[0.6, 0.9, 0.4, 0.8, 0.5].map((val, i) => (
          <span 
            key={i}
            className="w-1.5 bg-black rounded-sm animate-[soundwave_1s_infinite_ease-in-out]" 
            style={{ 
              height: `${val * 100}%`,
              animationDelay: `${i * 0.15}s`,
              transformOrigin: "bottom"
            }} 
          />
        ))}
      </div>
    </div>
  )
}

function WebRTCStreamVisualizer() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#e7d8ee]/30 overflow-hidden select-none p-4">
      {/* Grid Coordinates Overlay */}
      <div className="absolute inset-0 opacity-15" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
        backgroundSize: "20px 20px"
      }} />

      <svg className="w-full h-full max-h-[140px] z-10" viewBox="0 0 200 100">
        {/* Animated Flowing Data Paths */}
        <path d="M 20 20 L 100 50 L 180 20" fill="none" stroke="black" strokeWidth="2" strokeDasharray="6, 6" className="animate-[flow-line_1.2s_infinite_linear]" />
        <path d="M 20 50 L 100 50 L 180 50" fill="none" stroke="black" strokeWidth="2" strokeDasharray="6, 6" className="animate-[flow-line_0.8s_infinite_linear]" />
        <path d="M 20 80 L 100 50 L 180 80" fill="none" stroke="black" strokeWidth="2" strokeDasharray="6, 6" className="animate-[flow-line_1.6s_infinite_linear]" />
        
        {/* Central Router Node */}
        <circle cx="100" cy="50" r="20" fill="white" stroke="black" strokeWidth="2.5" />
        <text x="100" y="53" textAnchor="middle" fontSize="7" fontWeight="bold" fontFamily="monospace">RTC_MUX</text>
        
        {/* Source Nodes */}
        <circle cx="20" cy="20" r="6" fill="#aadcff" stroke="black" strokeWidth="2" />
        <circle cx="20" cy="50" r="6" fill="#fd8a65" stroke="black" strokeWidth="2" />
        <circle cx="20" cy="80" r="6" fill="#ffff8c" stroke="black" strokeWidth="2" />
        
        {/* Destination Nodes */}
        <circle cx="180" cy="20" r="6" fill="#aadcff" stroke="black" strokeWidth="2" />
        <circle cx="180" cy="50" r="6" fill="#fd8a65" stroke="black" strokeWidth="2" />
        <circle cx="180" cy="80" r="6" fill="#ffff8c" stroke="black" strokeWidth="2" />
      </svg>
    </div>
  )
}

function AutopilotConsoleVisualizer() {
  const [logs, setLogs] = useState<string[]>([
    "> INIT COORDS PARSER // CONSOLE ACTIVE",
    "> TELEMETRY BINDING ATTACHED",
  ])
  
  useEffect(() => {
    const pool = [
      "> SPEAKER ALICE: 'adjust audio zone bounds'",
      "> NLP INFERENCE: IDENTIFIED WORKSPACE CONFIG",
      "> ACTIVE TOPICS: [audio_scale, latency, webrtc]",
      "> GENERATED ACTION ITEM: TWEAK SOUND ATTENUATION",
      "> DETECTED SPEAKER dev: 'handshake timing is low'",
      "> COMPLETED SYNC PROCESS WITH COLYSEUS_GATEWAY",
    ]
    let idx = 0
    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, pool[idx] as string]
        if (next.length > 5) next.shift() // keep last 5 lines
        return next
      })
      idx = (idx + 1) % pool.length
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-full flex flex-col bg-black p-6 font-mono text-[9px] text-[#28a745] overflow-hidden leading-normal select-none">
      <div className="absolute top-3 right-4 h-1.5 w-1.5 rounded-full bg-[#28a745] animate-pulse" />
      <div className="flex-grow flex flex-col gap-1.5 justify-end font-mono">
        {logs.map((log, i) => (
          <div key={i} className="truncate tracking-wide">{log}</div>
        ))}
        <div className="flex items-center gap-0.5 mt-0.5 opacity-90">
          <span>&gt; STREAMING COORD_METRICS</span>
          <span className="w-1.5 h-3 bg-[#28a745] animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// Re-engineered Features: 3-column staggered masonry project grid (matching frame 3)
export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-6 py-36 border-t border-black">
      <div className="text-center mb-24">
        <p className="text-[12px] font-mono font-bold tracking-widest uppercase text-black">/ ARCHITECTURAL CAPABILITIES</p>
        <h2 
          className="mt-6 uppercase text-black h-2-tight max-w-2xl mx-auto"
          style={{ fontSize: "clamp(1.875rem, 1.092rem + 2.609vw, 3.375rem)" }}
        >
          Systems designed for coordinate-based work
        </h2>
      </div>

      {/* Masonry Columns with offset stagger on Column 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Column 1: Proximity Audio */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[24px] overflow-hidden border border-black bg-[#aadcff] aspect-[4/3] flex flex-col justify-between hover:shadow-lg hover:border-black transition-all duration-300 transform hover:-translate-y-1">
            <span className="text-[12px] font-mono text-black font-bold uppercase p-8 pb-0">/ FIELD_DYNAMICS</span>
            <div className="flex-grow h-0 w-full overflow-hidden">
              <ProximityAudioVisualizer />
            </div>
          </div>
          <div>
            <span className="text-[12px] font-mono text-[#77786d]">01 // SPATIAL_INFRA</span>
            <h3 className="mt-3 text-[20px] font-bold uppercase tracking-tight text-black">Proximity Audio Pipeline</h3>
            <p className="mt-2 text-xs text-[#77786d] leading-relaxed">
              Linear distance attenuation modeled in real-time. Sound volumes scale logarithmically as avatars move across coordinates.
            </p>
            <span className="inline-block mt-4 rounded-[100px] bg-[#f0f0ef] border border-black/10 px-3.5 py-1 text-[9px] font-mono text-black uppercase">
              Logarithmic Decibel Attenuation
            </span>
          </div>
        </div>

        {/* Column 2: WebRTC - Staggered offset (margin-top in desktop) */}
        <div className="flex flex-col gap-6 md:mt-16">
          <div className="rounded-[24px] overflow-hidden border border-black bg-[#e7d8ee] aspect-[4/3] flex flex-col justify-between hover:shadow-lg hover:border-black transition-all duration-300 transform hover:-translate-y-1">
            <span className="text-[12px] font-mono text-black font-bold uppercase p-8 pb-0">/ MULTIPLEX_STREAM</span>
            <div className="flex-grow h-0 w-full overflow-hidden">
              <WebRTCStreamVisualizer />
            </div>
          </div>
          <div>
            <span className="text-[12px] font-mono text-[#77786d]">02 // RTC_COMMUNICATIONS</span>
            <h3 className="mt-3 text-[20px] font-bold uppercase tracking-tight text-black">Direct Peer Media Streaming</h3>
            <p className="mt-2 text-xs text-[#77786d] leading-relaxed">
              Low-latency WebRTC streams bound dynamically to coordinate zones, minimizing network payload overhead.
            </p>
            <span className="inline-block mt-4 rounded-[100px] bg-[#f0f0ef] border border-black/10 px-3.5 py-1 text-[9px] font-mono text-black uppercase">
              Gateway Peer Connectors
            </span>
          </div>
        </div>

        {/* Column 3: AI Summarizer */}
        <div className="flex flex-col gap-6">
          <div className="rounded-[24px] overflow-hidden border border-black bg-black aspect-[4/3] flex flex-col justify-between hover:shadow-lg hover:border-black transition-all duration-300 transform hover:-translate-y-1">
            <span className="text-[12px] font-mono text-[#28a745] font-bold uppercase p-8 pb-0">/ LOGS_PARSING</span>
            <div className="flex-grow h-0 w-full overflow-hidden">
              <AutopilotConsoleVisualizer />
            </div>
          </div>
          <div>
            <span className="text-[12px] font-mono text-[#77786d]">03 // AGENTIC_INFERENCE</span>
            <h3 className="mt-3 text-[20px] font-bold uppercase tracking-tight text-black">Autopilot Zone Summarizer</h3>
            <p className="mt-2 text-xs text-[#77786d] leading-relaxed">
              Natural language processing listening to active meeting zone logs to compile automated action items.
            </p>
            <span className="inline-block mt-4 rounded-[100px] bg-[#f0f0ef] border border-black/10 px-3.5 py-1 text-[9px] font-mono text-black uppercase">
              Autopilot Summaries
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ThemesShowcase() {
  const [themeIndex, setThemeIndex] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const themes = [
    {
      name: "Modern Tech HQ",
      tag: "THEME 01 // COOL BLUE",
      desc: "Cool blue/gray palette featuring collaborative sprint zones. Work side-by-side with your engineering squad to unlock team-wide XP multipliers.",
      src: "/assets/preview_office.png"
    },
    {
      name: "Zen Garden Studio",
      tag: "THEME 02 // SAGE HARMONY",
      desc: "Warm wood floors and soft sage carpets. Features a centering koi pond centerpiece. Maintain focus streaks to water and grow your custom desk bonsai.",
      src: "/assets/preview_zen.png"
    },
    {
      name: "Library Loft",
      tag: "THEME 03 // DARK ACADEMIA",
      desc: "Quiet-zone rules enforced automatically. Auto-mute microphone buffers in the reading corridors and take on coding quests from the local bulletin board.",
      src: "/assets/preview_tiles.png"
    },
    {
      name: "Sunny Cafe Cowork",
      tag: "THEME 04 // GOLDEN HOUR",
      desc: "Light wood floors and gold carpets. A vibrant social hub with barista bars and automated coffee-chat matching to pair you with online peers.",
      src: "/assets/preview_cafe.png"
    }
  ]

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setThemeIndex((prev) => (prev + 1) % 4)
    }, 5000)
  }, [])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const nextTheme = () => {
    setThemeIndex((prev) => (prev + 1) % 4)
    resetTimer()
  }

  const prevTheme = () => {
    setThemeIndex((prev) => (prev === 0 ? 3 : prev - 1))
    resetTimer()
  }

  return (
    <section id="themes" className="px-6 py-24 border-t border-zinc-200 bg-[#fbfbfa] select-none">
      <div className="mx-auto max-w-6xl">
        <p className="text-[12px] font-mono font-bold tracking-widest uppercase text-black mb-2">/ PLAYABLE OFFICE THEMES</p>
        <h2 
          className="uppercase text-black font-extrabold tracking-tight mb-12 text-3xl sm:text-4xl"
        >
          Curated workspace aesthetics
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Dynamic details block */}
          <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
            <span className="text-[11px] font-mono tracking-[0.2em] text-[#5b5bf0] font-bold uppercase">
              {themes[themeIndex]?.tag}
            </span>
            <h3 
              className="text-zinc-900 text-3xl sm:text-4xl font-normal tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {themes[themeIndex]?.name}
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-md font-sans">
              {themes[themeIndex]?.desc}
            </p>
            
            {/* Manual Controls */}
            <div className="flex items-center gap-4 mt-4">
              <button 
                onClick={prevTheme}
                className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shadow-sm transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-zinc-700 stroke-[2.5]">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-xs font-mono font-bold text-zinc-400">
                0{themeIndex + 1} / 04
              </span>
              <button 
                onClick={nextTheme}
                className="w-10 h-10 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shadow-sm transition-all"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-zinc-700 stroke-[2.5]">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Right: Big Zoomed image */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[24px] border border-black/10 shadow-2xl bg-white group cursor-pointer">
              <img 
                src={themes[themeIndex]?.src || ""} 
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 ease-out scale-[1.03] hover:scale-[1.12]"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Strategy & Services section (matching frame 4 & detailed descriptions from frame 40)
export function StrategySection() {
  const serviceCards = [
    {
      head: "/ AUDIO_PIPELINE",
      title: "Spatial Audio Engine",
      desc: "Drives real-time 3D panning audio based on coordinates. As peers move closer, voice levels dynamically mix, creating natural proximity-based conversations.",
      accent: "#aadcff", // Celeste
      renderVisual: () => (
        <div className="relative h-16 w-full bg-[#aadcff]/10 rounded-[12px] border border-black/10 flex items-center justify-center gap-1.5 overflow-hidden">
          {[0.6, 0.4, 0.8, 0.5, 0.7, 0.3].map((val, i) => (
            <span
              key={i}
              className={`w-1.5 bg-[#276284] rounded-full bar-anim bar-anim-${(i % 4) + 1}`}
              style={{
                height: `${val * 100}%`,
                animationDelay: `${i * 0.15}s`,
                maxHeight: "36px"
              }}
            />
          ))}
        </div>
      )
    },
    {
      head: "/ TELEMETRY_MESH",
      title: "State Sync Engine",
      desc: "Synchronizes user positions, states, and client telemetry via Bun and Colyseus.js. Delivering sub-50ms updates for seamless multiplayer interactions.",
      accent: "#fd8a65", // Coral
      renderVisual: () => (
        <div className="relative h-16 w-full bg-[#fd8a65]/10 rounded-[12px] border border-black/10 flex items-center justify-center overflow-hidden">
          <div className="relative h-6 w-6 rounded-full bg-[#fd8a65] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#fd8a65] animate-ping opacity-60" />
            <span className="absolute inset-[-8px] rounded-full bg-[#fd8a65] animate-ping opacity-30" style={{ animationDelay: "0.4s" }} />
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          </div>
        </div>
      )
    },
    {
      head: "/ CANVAS_GEOMETRY",
      title: "Custom Space Editor",
      desc: "Create, partition, and theme rooms in a flexible canvas workspace. Build custom interactive zones, focus rooms, and private corridors instantly.",
      accent: "#e7d8ee", // Malva
      renderVisual: () => (
        <div className="relative h-16 w-full bg-[#e7d8ee]/10 rounded-[12px] border border-black/10 flex items-center justify-center overflow-hidden">
          <div className="relative w-12 h-12 flex flex-col items-center justify-center">
            <div className="absolute w-8 h-4 bg-[#e7d8ee] border border-[#7a488f] rounded-[2px] iso-layer iso-layer-1" style={{ transform: "translateY(-6px) rotate(-15deg) skewX(20deg)" }} />
            <div className="absolute w-8 h-4 bg-white border border-[#7a488f] rounded-[2px] iso-layer iso-layer-2" style={{ transform: "translateY(0px) rotate(-15deg) skewX(20deg)" }} />
            <div className="absolute w-8 h-4 bg-[#7a488f] border border-black rounded-[2px] iso-layer iso-layer-3" style={{ transform: "translateY(6px) rotate(-15deg) skewX(20deg)" }} />
          </div>
        </div>
      )
    },
    {
      head: "/ PLATFORM_PORTABILITY",
      title: "Multi-Platform SDK",
      desc: "Run TwoD VERSE on Next.js, or connect via our Godot SDK for native desktop and 3D spatial clients. Complete developer flexibility out of the box.",
      accent: "#bbf7d0", // Light Green
      renderVisual: () => (
        <div className="relative h-16 w-full bg-black rounded-[12px] p-3 border border-black/20 flex flex-col justify-center overflow-hidden">
          <code className="text-[7.5px] font-mono text-[#28a745] leading-normal tracking-wide block truncate">
            {`$ bun add @twoD-verse/client`}
          </code>
          <code className="text-[7.5px] font-mono text-white/60 leading-normal tracking-wide block truncate mt-1 flex items-center gap-0.5">
            {`> Initializing Spatial Engine...`}
            <span className="w-1 h-3 bg-[#28a745] animate-pulse" />
          </code>
        </div>
      )
    }
  ]
  return (
    <section id="services" className="relative mx-auto max-w-6xl px-6 py-36 border-t border-black">
      <style>{`
        @keyframes soundwave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        .bar-anim {
          animation: soundwave 1.2s ease-in-out infinite;
          transform-origin: center;
        }
        .bar-anim-1 { animation-duration: 0.9s; }
        .bar-anim-2 { animation-duration: 0.6s; }
        .bar-anim-3 { animation-duration: 0.8s; }
        .bar-anim-4 { animation-duration: 0.5s; }

        .iso-layer {
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-hover:hover .iso-layer-1 {
          transform: translateY(-12px) rotate(-15deg) skewX(20deg) !important;
        }
        .card-hover:hover .iso-layer-2 {
          transform: translateY(0px) rotate(-15deg) skewX(20deg) !important;
        }
        .card-hover:hover .iso-layer-3 {
          transform: translateY(12px) rotate(-15deg) skewX(20deg) !important;
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.85); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.45; }
          100% { transform: scale(0.85); opacity: 0.15; }
        }
        @keyframes orbit {
          0%, 100% { transform: translate(45px, -22px); }
          25% { transform: translate(-22px, -35px); }
          50% { transform: translate(-45px, 22px); }
          75% { transform: translate(22px, 35px); }
        }
        @keyframes flow-line {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <div className="flex flex-col items-center text-center gap-10 w-full mb-12">
        <h2 className="uppercase text-black h-2-tight w-full text-center max-w-5xl" style={{ fontSize: "clamp(1.3125rem, 0.76rem + 1.83vw, 2.3625rem)", lineHeight: 1.15 }}>
          We bring together spatial technology, low-latency audio, and real-time multiplayer systems to build environments that scale as your team grows.
        </h2>
        <div className="flex justify-center w-full">
          <SlideToExploreButton />
        </div>
      </div>

      {/* Services Grid with 4 Unique Animated Cards */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
        {serviceCards.map((sc) => (
          <div 
            key={sc.title} 
            className="card-hover rounded-[24px] bg-[#f0f0ef] border border-black/10 p-6.5 flex flex-col justify-between min-h-[340px] hover:border-black hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            style={{
              outline: "none"
            }}
          >
            <div className="flex flex-col gap-5">
              <span className="text-[9px] font-mono font-bold text-[#77786d] uppercase tracking-widest block">{sc.head}</span>
              <h3 className="text-[17px] font-bold text-black uppercase tracking-tight leading-snug">{sc.title}</h3>
              <p className="text-[11.5px] text-[#77786d] leading-relaxed tracking-tight" style={{ fontFamily: "var(--font-messina-sans)" }}>{sc.desc}</p>
            </div>
            <div className="mt-6 pt-4 border-t border-black/5">
              {sc.renderVisual()}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-24 border-t-[4px] border-black bg-[#f5f4f0] select-none font-mono">
      <div className="mx-auto max-w-6xl">
        <p className="text-[12px] font-bold tracking-widest uppercase text-black mb-2">/ DEPLOYMENT PIPELINE</p>
        <h2 
          className="uppercase text-black font-extrabold tracking-tight mb-16 text-3xl sm:text-4xl"
        >
          System initialization flow
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} style={{ backgroundColor: s.color }} className="border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all">
              <span className="bg-black text-white px-2.5 py-0.5 text-[10px] font-bold font-mono inline-block mb-4">{s.n}</span>
              <h3 
                className="uppercase text-black font-bold tracking-tight text-[16px]"
              >
                {s.title}
              </h3>
              <p 
                className="mt-3 text-zinc-600 leading-relaxed text-[11.5px]"
              >
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FAQ() {
  const [openFaq, setOpenFaq] = useState<number>(-1)
  
  const faqData = [
    { q: 'What is TwoD VERSE?', a: 'A 2D spatial workspace where your team shares one living map. You move an avatar between rooms and desks, and conversations happen based on where you stand.' },
    { q: 'Does it run in the browser?', a: 'Yes. Nothing to install for you or your guests — share a link and anyone joins from Chrome, Safari, Firefox, or Edge on desktop and mobile.' },
    { q: 'How does spatial audio work?', a: 'Voices get louder as avatars move closer and fade as they move apart, so several conversations can share the same room without talking over each other.' },
    { q: 'How many people can join a space?', a: 'Free spaces host up to 25 people at once. Paid plans scale to hundreds of concurrent teammates and guests across rooms and stages.' },
    { q: 'Is there a free plan?', a: 'Yes — one space with all core features, free forever. Upgrade when you need bigger capacity, custom floors, or guest analytics.' }
  ]

  return (
    <section id="faq" className="px-6 py-28 border-t border-zinc-200 bg-white select-none">
      <div className="mx-auto max-w-6xl">
        
        {/* Centered Header block like Golden Child */}
        <div className="text-center mb-20">
          <p className="text-[11px] font-mono tracking-[0.25em] uppercase text-zinc-400">FAQS</p>
          <h2 
            className="mt-3 text-black font-normal tracking-tight text-4xl sm:text-5xl"
            style={{ fontFamily: "Georgia, serif", textTransform: "none" }}
          >
            Frequently Asked Questions
          </h2>
        </div>

        {/* Widescreen Video block matching Golden Child banner */}
        <div className="w-full mb-16 overflow-hidden rounded-[24px] border border-zinc-200/50 shadow-sm">
          <video 
            src="/videos/v2.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-auto max-h-[480px] object-cover block" 
          />
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Left Column: FAQ Items styled like Nocturn (soft, faded, rounded cards) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {faqData.map((f, i) => (
              <div 
                key={i} 
                className="bg-[#f8f9fc] p-6 rounded-[16px] transition-all duration-200 hover:bg-[#f3f5fa]"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)} 
                  className="w-full flex items-center justify-between gap-5 bg-transparent border-0 outline-none cursor-pointer text-left font-medium text-[16px] text-zinc-900"
                >
                  <span style={{ fontFamily: "var(--font-space-grotesk, system-ui), sans-serif", letterSpacing: "-0.01em" }}>{f.q}</span>
                  <span className="text-[20px] font-medium text-[#5b5bf0] select-none transition-transform duration-200">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div 
                    className="mt-4 pt-4 border-t border-zinc-200/50 text-[14px] text-zinc-500 leading-relaxed"
                    style={{ fontFamily: "var(--font-space-grotesk, system-ui), sans-serif" }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Column: "Didn't find the answer..." styled like Golden Child */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-6 p-2">
            <h3 
              className="text-zinc-950 text-3xl font-normal leading-tight tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Didn't find the answer you were looking for?
            </h3>
            <a 
              href="mailto:hello@twodverse.com"
              className="text-[11px] font-bold tracking-[0.2em] uppercase text-zinc-800 hover:text-black transition-colors self-start border-b-2 border-black pb-1.5 font-mono"
            >
              SEND US AN EMAIL
            </a>
          </div>

        </div>

      </div>
    </section>
  )
}

// Upgraded white-on-black collaborative footer matching mockup with pixel-art vibe
export function Footer() {
  return (
    <footer className="bg-[#121212] text-[#f4f4f5] px-6 py-20 border-t border-zinc-800 select-none font-sans">
      <div className="mx-auto max-w-6xl">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16">
          
          {/* Left Column: Brand, Description, Socials */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <TwoDVerseLogo className="text-white" />
              <span className="font-bold text-white text-[18px] tracking-tight">TwoD VERSE</span>
            </div>
            <p className="text-[14px] text-zinc-400 leading-relaxed max-w-sm">
              TwoD VERSE is a live spatial platform where teams share one living map. Compete in daily standups, collaborate on desk rooms, and build presence from browser-powered spaces.
            </p>
            
            {/* Social Icons (bottom left of left column) */}
            <div className="flex items-center gap-5 mt-4 text-zinc-400">
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Right Columns: Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Resources */}
            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-semibold text-white">Resources</span>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Blog</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Brand</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">FAQ</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Help & Support</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Community</a>
            </div>
            
            {/* Developers */}
            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-semibold text-white">Developers</span>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Documentation</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">API Reference</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Open Source</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Security</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Bug Bounty</a>
            </div>
            
            {/* About */}
            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-semibold text-white">About</span>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">TwoD Labs</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Careers</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Contact</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Press</a>
            </div>
            
            {/* Legal */}
            <div className="flex flex-col gap-3">
              <span className="text-[14px] font-semibold text-white">Legal & Privacy</span>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Privacy Policy</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Terms of Service</a>
              <a href="#" className="text-zinc-400 hover:text-white text-[13px] transition-colors duration-150">Cookie Policy</a>
            </div>
            
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-zinc-500 pt-8 border-t border-zinc-800/60">
          <span>© 2026 TwoD VERSE. All rights reserved.</span>
          <span>Spatial presence for every team</span>
        </div>

      </div>
    </footer>
  )
}



