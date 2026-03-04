"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import type Phaser from "phaser"
import { useSpaceSidebar } from "@/components/sidebar/SpaceSidebarContext"
import { MapPinned, Send } from "lucide-react"

export default function GameCanvas() {
  const {
    activePane,
    currentChatUser,
    threadMessages,
    currentUser,
    sendMessage,
    activatePane,
  } = useSpaceSidebar()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState("init: waiting")
  const [draft, setDraft] = useState("")
  const showChatPanel = activePane === "chat"

  useEffect(() => {
    let isMounted = true

    const initGame = async () => {
      // Prevent server execution
      if (typeof window === "undefined") return

      // Prevent duplicate creation (StrictMode fix)
      if (gameRef.current) return

      if (!containerRef.current) return

      try {
        setStatus("init: importing phaser")
        const Phaser = (await import("phaser")).default
        const MainScene = (await import("@/phaser/MainScene")).default

        if (!isMounted) return

        setStatus("init: creating game")
        gameRef.current = new Phaser.Game({
          type: Phaser.CANVAS,
          width: 1600,
          height: 800,
          parent: containerRef.current, 
          backgroundColor: "#1e1e1e",
          physics: {
            default: "arcade",
            arcade: {
              debug: false,
            },
          },
          scene: [MainScene],
          scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: {
            pixelArt: true,
            antialias: false,
            roundPixels: true,
          },
        })
        setStatus("")
      } catch (err) {
        setStatus("init: failed (check console)")
        console.error("Phaser initialization failed:", err)
      }
    }

    initGame()

    return () => {
      isMounted = false

      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!showChatPanel) return
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [showChatPanel, threadMessages.length])

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft("")
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#3f2a17] bg-[#0b0f19]">
      <div className="flex h-full w-full">
        <div className={`${showChatPanel ? "w-full lg:w-[calc(100%-21rem)]" : "w-full"} relative h-full transition-all duration-200`}>
          <div
            className="absolute left-3 top-3 z-10 rounded bg-black/70 px-2 py-1 text-xs text-cyan-300"
          >
            {status}
          </div>

          <div
            ref={containerRef}
            className="h-full w-full overflow-hidden rounded-xl"
          />
        </div>

        {showChatPanel && (
          <aside className="absolute inset-y-0 right-0 z-20 w-full max-w-[21rem] border-l border-[#6b4b2a] bg-[#1f140c]/95 backdrop-blur-sm lg:relative lg:max-w-none lg:w-[21rem]">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-[#6b4b2a] px-3 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-yellow-300/80">Current chat</p>
                  <p className="text-sm font-semibold text-yellow-100">{currentChatUser?.name || "Space chat"}</p>
                </div>
                <button
                  onClick={() => activatePane("map")}
                  className="rounded-md border border-[#6b4b2a] p-2 text-yellow-200 hover:bg-[#3b2a1a]"
                  title="Back to map"
                >
                  <MapPinned size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3">
                {threadMessages.length === 0 ? (
                  <p className="rounded-md border border-[#6b4b2a] bg-[#2a1b11] px-3 py-2 text-xs text-yellow-300/70">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  threadMessages.map((message) => {
                    const mine = message.fromUserId === currentUser?.id
                    return (
                      <div key={message.id} className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-[#556b2f] text-white" : "bg-[#2a1b11] text-yellow-100"}`}>
                          <p className="text-[11px] opacity-80">{message.fromUserName}</p>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-[#6b4b2a] p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={`Message ${currentChatUser?.name || "space"}`}
                    className="w-full rounded-md border border-[#6b4b2a] bg-[#1b120c] px-3 py-2 text-sm text-yellow-100 outline-none placeholder:text-yellow-300/50"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-[#556b2f] p-2 text-white hover:bg-[#6b8e23]"
                    title="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
