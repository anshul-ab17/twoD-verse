"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

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
  { n: "01 / STEP", title: "Initialize Sandbox", text: "Select an architectural layout profile: standard headquarters, hackathon floor, or custom coordinate map." },
  { n: "02 / STEP", title: "Establish Peers", text: "Generate tokenized gateway links. Access is instant via standard browsers with no dependency installs." },
  { n: "03 / STEP", title: "Coordinate Drop-in", text: "Avatars initialize on the 2D grid. Proximity circles activate spatial audio feeds automatically." },
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
function InteractiveWorldPreview() {
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
    const you = { x: width / 2, y: height / 2, radius: 10, targetX: width / 2, targetY: height / 2, speed: 0.08, color: "#fd8a65", name: "YOU", role: "GUEST_PEER" } // Orange
    const alice = { x: width * 0.25, y: height * 0.35, radius: 8, angle: 0, speed: 0.012, color: "#aadcff", name: "ALICE", role: "UI_DESIGNER" } // Light Blue
    const bob = { x: width * 0.75, y: height * 0.65, radius: 8, angle: Math.PI, speed: 0.008, color: "#e7d8ee", name: "BOB", role: "ENGINEER" } // Malva

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

      // 1. Draw Technical Blueprint Background (Strict Monochrome gray line grid)
      ctx.strokeStyle = "#dadbd7" // Gray 200
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

      ctx.fillStyle = "#77786d" // Gray 500
      ctx.font = "8px var(--font-messina-sans-mono), monospace"
      for (let x = 80; x < width; x += 160) {
        ctx.fillText(`X:${x}`, x, 12)
      }
      for (let y = 80; y < height; y += 120) {
        ctx.fillText(`Y:${y}`, 6, y)
      }

      // 2. Draw Office Spatial Zones (Strict borders, solid fills)
      // Meeting Zone (Deep Blue fill)
      const mZone = { x: width * 0.35, y: height * 0.2, w: width * 0.3, h: height * 0.6 }
      ctx.fillStyle = "rgba(39, 98, 132, 0.03)" // Deep Blue
      ctx.fillRect(mZone.x, mZone.y, mZone.w, mZone.h)
      ctx.strokeStyle = "#276284" // Deep Blue
      ctx.lineWidth = 1.5
      ctx.strokeRect(mZone.x, mZone.y, mZone.w, mZone.h)
      
      ctx.fillStyle = "#276284"
      ctx.font = "bold 9px var(--font-messina-sans-mono), monospace"
      ctx.fillText("// ZONE_01_SECURE_MEET", mZone.x + 15, mZone.y + 25)
      ctx.fillStyle = "#77786d"
      ctx.fillText(`BOUNDS: [${Math.floor(mZone.x)}, ${Math.floor(mZone.y)}, ${Math.floor(mZone.w)}x${Math.floor(mZone.h)}]`, mZone.x + 15, mZone.y + 40)
      
      // Focus Desks (Gray Surface)
      const deskL = { x: width * 0.08, y: height * 0.55, w: 160, h: 100 }
      ctx.fillStyle = "#f0f0ef" // Gray 100
      ctx.fillRect(deskL.x, deskL.y, deskL.w, deskL.h)
      ctx.strokeStyle = "#dadbd7" // Gray 200
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

      // Proximity Rings
      const drawProximityRing = (ent: Entity) => {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(ent.x, ent.y, 100, 0, Math.PI * 2)
        ctx.stroke()
      }
      drawProximityRing(you)

      // Avatars (Strict sharp layout boxes with Afternow pill rounded labels)
      const drawAvatar = (ent: Entity, isActive: boolean) => {
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

        // Technical coordinate ticks
        ctx.beginPath()
        ctx.moveTo(ent.x - 16, ent.y)
        ctx.lineTo(ent.x + 16, ent.y)
        ctx.moveTo(ent.x, ent.y - 16)
        ctx.lineTo(ent.x, ent.y + 16)
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)"
        ctx.stroke()

        // Name tag (Messina Mono, flat bordered card)
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

      // Video feeds (Flat solid white bordered panels)
      const drawVideoFeed = (ent: Entity, offset: number, faceSeed: number) => {
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

        // Wave lines
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

      // Dialog Speech Bubbles (Monochrome box, no shadow)
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
    <div ref={containerRef} className="relative w-full aspect-video rounded-[24px] overflow-hidden border border-black bg-white">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-[100px] bg-[#f0f0ef] border border-black px-3.5 py-1.5 text-[9px] font-mono tracking-widest text-black">
        <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
        TELEMETRY_RADAR_MAP_v2.0
      </div>
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-between items-center bg-white border border-black px-4 py-3 rounded-[12px] text-[9px] font-mono text-black">
        <span className="tracking-tight">{hoverText}</span>
        <span className="text-[#77786d] text-[8px] tracking-wide">GRID: 80x80 · STATUS: PERSISTENT</span>
      </div>
    </div>
  )
}

export function Hero() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Parallax & smooth scroll scaling factors matching afternow.co hero pins
  const textOpacity = Math.max(0, 1 - scrollY / 500)
  const textTranslateY = scrollY * 0.35
  const mediaScale = Math.min(1.0, 0.65 + (scrollY / 500) * 0.35)

  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-24 bg-white tech-grid overflow-hidden">
      {/* Background soft ambient monochrome overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle 900px at 50% -300px, rgba(0,0,0,0.02), transparent, transparent)"
        }}
        aria-hidden
      />

      <div 
        style={{ 
          opacity: textOpacity, 
          transform: `translateY(${textTranslateY}px)`,
          transition: "transform 0.1s ease-out, opacity 0.1s ease-out"
        }}
        className="flex flex-col items-center text-center"
      >
        <span className="relative inline-flex items-center gap-1.5 rounded-[100px] border border-black bg-[#f0f0ef] px-4 py-1.5 text-[9px] font-mono font-bold tracking-widest text-black uppercase">
          MODEL_SPEC_2.0 // DEPLOYED
        </span>

        <h1
          className="relative mt-8 h-display uppercase text-black text-center"
          style={{ fontSize: "clamp(3.625rem, 2.06rem + 5.217vw, 6.625rem)", letterSpacing: "-0.05em", lineHeight: 1.09 }}
        >
          We build spatial
          <br />
          coordinate engines.
        </h1>

        <p 
          className="relative mt-8 max-w-xl text-center text-xs tracking-tight text-[#77786d]"
          style={{ fontFamily: "var(--font-messina-sans)", fontSize: "15.7376px", lineHeight: "22.8195px", letterSpacing: "-0.314752px" }}
        >
          Verse is a global digital workspace that transitions companies from dry video call lists to dense, real-time, proximity-based spatial presence. Engineered for rapid collaboration.
        </p>

        <div className="relative mt-12 flex items-center justify-center gap-4">
          <Link
            href="/verse"
            className="rounded-[100px] bg-black hover:bg-zinc-800 text-white px-8 py-4.5 text-[12px] font-bold font-mono uppercase tracking-widest transition-all duration-200 border border-black"
          >
            Initialize Space →
          </Link>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-[100px] border border-black bg-white hover:bg-[#f0f0ef] px-6 py-4.5 text-[12px] font-bold font-mono uppercase tracking-widest text-black transition-all duration-200"
          >
            View Specs
          </a>
        </div>
      </div>

      {/* Hero visual Laptop Showcase card with Celeste/Purple border gradient */}
      <div 
        style={{
          transform: `scale(${mediaScale})`,
          transition: "transform 0.1s ease-out"
        }}
        className="relative mt-24 w-full max-w-5xl p-2 bg-[#f0f0ef] border-4 border-[#276284] rounded-[24px]"
      >
        <InteractiveWorldPreview />
      </div>
    </header>
  )
}

// Staggered masonry client/stack logo reel
export function ClientLogoReel() {
  const logos = ["NEXT.JS", "TAILWIND CSS", "WEBRTC", "COLYSEUS.JS", "TYPESCRIPT"]
  return (
    <section className="bg-white py-16 border-t border-black/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
          {logos.map((l) => (
            <div key={l} className="text-[16px] font-extrabold font-sans tracking-widest text-black">
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
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
          <div className="rounded-[24px] overflow-hidden border border-black bg-[#aadcff] aspect-[4/3] p-8 flex flex-col justify-between">
            <span className="text-[12px] font-mono text-black font-bold uppercase">/ FIELD_DYNAMICS</span>
            <div className="flex flex-col gap-1.5">
              <span className="h-2 w-full rounded-full bg-black/10 relative overflow-hidden"><span className="absolute inset-y-0 left-0 w-2/3 bg-black" /></span>
              <span className="h-2 w-full rounded-full bg-black/10 relative overflow-hidden"><span className="absolute inset-y-0 left-0 w-1/3 bg-black" /></span>
              <span className="h-2 w-full rounded-full bg-black/10 relative overflow-hidden"><span className="absolute inset-y-0 left-0 w-4/5 bg-black" /></span>
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
          <div className="rounded-[24px] overflow-hidden border border-black bg-[#e7d8ee] aspect-[4/3] p-8 flex flex-col justify-between">
            <span className="text-[12px] font-mono text-black font-bold uppercase">/ MULTIPLEX_STREAM</span>
            <div className="flex justify-center items-center h-full">
              <span className="h-16 w-16 rounded-full border-2 border-black flex items-center justify-center font-mono text-[10px] text-black">RTC_MUX</span>
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
          <div className="rounded-[24px] overflow-hidden border border-black bg-[#ffff8c] aspect-[4/3] p-8 flex flex-col justify-between">
            <span className="text-[12px] font-mono text-black font-bold uppercase">/ LOGS_PARSING</span>
            <div className="flex flex-col gap-2 font-mono text-[9px] text-black/70">
              <div>&gt; PARSING MEETING ZONE 1</div>
              <div>&gt; DETECTED SPEAKER: ALICE</div>
              <div>&gt; SUMMARIZING ACTION ITEMS...</div>
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

// Strategy & Services section (matching frame 4 & detailed descriptions from frame 40)
export function StrategySection() {
  const serviceCards = [
    {
      title: "Strategy",
      desc: "We establish clarity and direction before anything gets built. Discovery, benchmarking and coordinate mapping that grounds decisions in spatial flow, not assumptions. We interrogate the requirements, identify what's actually possible, and set a common thread."
    },
    {
      title: "Brand",
      desc: "We design visual and verbal systems that resonate and endure. Space guidelines, component libraries, and visual assets are built for consistency across every coordinate zone and room, rendering a unique spatial brand identity."
    },
    {
      title: "Website",
      desc: "We build brand-led workspaces that work hard for your business. Clear messaging, smooth user navigation journeys, and coordinate management systems with robust guardrails baked in. Interfaces your teams can use without losing consistency."
    },
    {
      title: "Product",
      desc: "We create platforms and digital tools that solve real presence problems. We design and build interaction flows, spatial audio zones, and low-latency client libraries. Through fast prototyping and testing, we validate direction early."
    },
    {
      title: "Development",
      desc: "We back our designs with robust engineering. Spatial engine programmers and web developers work hand-in-hand to create technology built for performance, low-latency multiplayer syncing, and long-term flexibility."
    }
  ]

  return (
    <section id="services" className="relative mx-auto max-w-6xl px-6 py-36 border-t border-black">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-8">
          <h2 className="uppercase text-black h-2-tight" style={{ fontSize: "clamp(1.875rem, 1.092rem + 2.609vw, 3.375rem)" }}>
            We bring together spatial technology, low-latency audio, and real-time multiplayer systems to build environments that scale as your team grows.
          </h2>
        </div>
        <div className="lg:col-span-4 flex justify-start lg:justify-end">
          <Link
            href="/verse"
            className="rounded-[100px] bg-black hover:bg-zinc-800 text-white px-8 py-4.5 text-[12px] font-bold font-mono uppercase tracking-widest transition-all duration-200 border border-black flex items-center gap-2"
          >
            Explore Platform <span>▶</span>
          </Link>
        </div>
      </div>

      {/* Services Grid with Detailed Text Cards (matching frame 40) */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-5 gap-6">
        {serviceCards.map((sc) => (
          <div 
            key={sc.title} 
            className="rounded-[24px] bg-[#f0f0ef] border border-black/10 p-8 flex flex-col gap-6"
          >
            <h3 className="text-[18px] font-bold text-black uppercase tracking-tight">{sc.title}</h3>
            <p className="text-[11px] text-[#77786d] leading-relaxed tracking-tight">{sc.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  return (
    <section id="how" className="px-6 py-20 border-t border-black bg-[#f0f0ef]">
      <div className="mx-auto max-w-6xl">
        <p className="text-[12px] font-mono font-bold tracking-widest uppercase text-black mb-2">/ DEPLOYMENT PIPELINE</p>
        <h2 
          className="uppercase text-black h-2-tight mb-16"
          style={{ fontSize: "clamp(1.875rem, 1.092rem + 2.609vw, 3.375rem)" }}
        >
          System initialization flow
        </h2>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="border-t border-black pt-6">
              <span className="text-[12px] font-mono text-[#77786d] block mb-4">{s.n}</span>
              <h3 
                className="uppercase text-black"
                style={{ fontSize: "17.7376px", fontWeight: "500", letterSpacing: "-0.354752px" }}
              >
                {s.title}
              </h3>
              <p 
                className="mt-3 text-[#77786d] leading-relaxed"
                style={{ fontSize: "13.8752px", letterSpacing: "-0.354752px" }}
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

// Gorgeous white-on-black collaborative footer (matching frame 5)
export function Footer() {
  return (
    <footer className="bg-black text-white px-6 pt-36 pb-20 border-t border-black">
      <div className="mx-auto max-w-6xl flex flex-col justify-between min-h-[400px]">
        {/* Let's explore block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <h2 className="text-4xl md:text-6xl font-mono uppercase tracking-tighter leading-none">
              Let's explore
              <br />
              what's next.
            </h2>
          </div>
          <div>
            <Link
              href="/verse"
              className="rounded-[100px] bg-white hover:bg-zinc-200 text-black px-10 py-5 text-[12px] font-bold font-mono uppercase tracking-widest transition-all duration-200 border border-white flex items-center gap-2"
            >
              Let's Collaborate <span>▶</span>
            </Link>
          </div>
        </div>

        {/* Bottom Metadata & Giant Logo overlay */}
        <div className="mt-32 pt-12 border-t border-white/10 flex flex-col gap-12">
          {/* Huge Logo */}
          <div className="w-full text-center">
            <h1 className="text-[15vw] md:text-[18vw] font-black tracking-tighter uppercase leading-[0.8] select-none text-white opacity-95">
              VERSE
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-mono uppercase tracking-wider text-[#77786d]">
            <div className="flex flex-wrap items-center gap-4">
              <a href="#" className="hover:text-white transition-colors duration-150">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-white transition-colors duration-150">Cookie Policy</a>
              <span>·</span>
              <span>© VERSE 2026. ALL RIGHTS RESERVED.</span>
            </div>
            
            <div className="flex gap-4">
              <a href="#" className="rounded-[100px] bg-zinc-900 px-3.5 py-1 text-white border border-white/10 hover:bg-zinc-800">GitHub</a>
              <a href="#" className="rounded-[100px] bg-zinc-900 px-3.5 py-1 text-white border border-white/10 hover:bg-zinc-800">Discord</a>
              <a href="#" className="rounded-[100px] bg-zinc-900 px-3.5 py-1 text-white border border-white/10 hover:bg-zinc-800">Specs</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}



