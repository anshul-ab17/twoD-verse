import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Pause, Play } from "lucide-react";
import SidebarInviteCard from "./SidebarInviteCard";
import SidebarUser from "./SidebarUser";
import { useSpaceSidebar } from "./SpaceSidebarContext";
import { apiFetch } from "@/lib/api";

type SpotifyTrack = {
  id: string
  name: string
  artists: string
  album: string
  imageUrl: string | null
  previewUrl: string | null
  spotifyUrl: string | null
}

interface Props {
  toggle: () => void;
}

export default function SidebarContent({ toggle }: Props) {
  const {
    activePane,
    activatePane,
    currentUser,
    members,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    notifications,
    openChatWithUser,
  } = useSpaceSidebar()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [spotifyQuery, setSpotifyQuery] = useState("")
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([])
  const [spotifyLoading, setSpotifyLoading] = useState(false)
  const [spotifyError, setSpotifyError] = useState("")
  const [spotifyPlayingTrackId, setSpotifyPlayingTrackId] = useState<string | null>(null)

  const otherMembers = useMemo(
    () => filteredMembers.filter((member) => member.id !== currentUser?.id),
    [currentUser?.id, filteredMembers]
  )

  const panelTitle =
    activePane === "chat"
      ? "chat"
      : activePane === "search"
        ? "search users"
      : activePane === "notifications"
        ? "notifications"
        : activePane === "spotify"
          ? "spotify"
          : "home"

  useEffect(() => {
    if (activePane !== "search") return
    searchInputRef.current?.focus()
  }, [activePane])

  useEffect(() => {
    if (activePane !== "spotify") return
    const query = spotifyQuery.trim()
    if (query.length < 2) {
      setSpotifyResults([])
      setSpotifyError("")
      setSpotifyLoading(false)
      return
    }

    const timeout = window.setTimeout(async () => {
      setSpotifyLoading(true)
      setSpotifyError("")
      try {
        const payload = await apiFetch<{ tracks: SpotifyTrack[] }>(
          `/api/spotify/search?q=${encodeURIComponent(query)}`
        )
        setSpotifyResults(Array.isArray(payload.tracks) ? payload.tracks : [])
      } catch (error) {
        const message = error instanceof Error ? error.message : "Spotify search failed"
        setSpotifyError(message)
      } finally {
        setSpotifyLoading(false)
      }
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [activePane, spotifyQuery])

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause()
        previewAudioRef.current = null
      }
    }
  }, [])

  const toggleSpotifyPreview = (track: SpotifyTrack) => {
    const existing = previewAudioRef.current
    if (spotifyPlayingTrackId === track.id && existing) {
      existing.pause()
      previewAudioRef.current = null
      setSpotifyPlayingTrackId(null)
      return
    }

    if (!track.previewUrl) {
      if (track.spotifyUrl) {
        window.open(track.spotifyUrl, "_blank", "noopener,noreferrer")
      }
      return
    }

    if (existing) {
      existing.pause()
      previewAudioRef.current = null
    }

    const nextAudio = new Audio(track.previewUrl)
    nextAudio.onended = () => {
      setSpotifyPlayingTrackId(null)
      previewAudioRef.current = null
    }
    previewAudioRef.current = nextAudio
    setSpotifyPlayingTrackId(track.id)
    void nextAudio.play().catch(() => {
      setSpotifyPlayingTrackId(null)
      previewAudioRef.current = null
    })
  }

  return (
    <div className="flex flex-col h-full p-4 text-yellow-100">

      {/* Header (NO CHEVRON NOW) */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-yellow-300">
          {panelTitle}
        </h1>
      </div>

      {/* Invite Card */}
      {activePane === "map" && <SidebarInviteCard />}

      {activePane !== "spotify" && (
        <input
          ref={searchInputRef}
          value={searchQuery}
          onFocus={() => activatePane("search")}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            activatePane("search")
          }}
          placeholder="Search people"
          className="
            bg-[#1f2a1f]
            border border-[#556b2f]
            p-2 rounded-lg mt-4
            text-sm
            text-yellow-200
            placeholder:text-yellow-400/60
          "
        />
      )}

      {activePane === "search" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-[#6b4b2a] bg-[#1a140f]">
          {otherMembers.length === 0 ? (
            <p className="p-3 text-xs text-yellow-300/70">No users found in this space.</p>
          ) : (
            otherMembers.map((member) => (
              <button
                key={member.id}
                className="flex w-full items-center justify-between border-b border-[#3e2a16] px-3 py-2 text-left text-sm hover:bg-[#2e2014]"
                onClick={() => {
                  openChatWithUser(member.id)
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    toggle()
                  }
                }}
              >
                <span className="text-yellow-100">{member.name}</span>
                <span className="text-[11px] text-yellow-300/75">chat</span>
              </button>
            ))
          )}
        </div>
      )}

      {activePane === "notifications" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-[#6b4b2a] bg-[#1a140f]">
          {notifications.length === 0 ? (
            <p className="p-3 text-xs text-yellow-300/70">No new activity in this space.</p>
          ) : (
            notifications.map((entry) => (
              <div key={entry.id} className="border-b border-[#3e2a16] px-3 py-2">
                <p className="text-sm text-yellow-100">{entry.message}</p>
                <p className="text-[11px] text-yellow-300/70">
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activePane === "chat" && (
        <div className="mt-3 rounded-lg border border-[#6b4b2a] bg-[#1a140f] p-3 text-sm text-yellow-200/85">
          <p className="font-medium text-yellow-100">Chat mode active</p>
          <p className="mt-1 text-xs">Use the map icon to return to map view and press it again to jump back to your current chat.</p>
        </div>
      )}

      {activePane === "spotify" && (
        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-lg border border-[#6b4b2a] bg-[#1a140f] p-3">
          <input
            value={spotifyQuery}
            onChange={(event) => setSpotifyQuery(event.target.value)}
            placeholder="Search songs or artists"
            className="rounded-md border border-[#6b4b2a] bg-[#24180f] px-3 py-2 text-sm text-yellow-100 outline-none placeholder:text-yellow-300/60"
          />

          {spotifyLoading && (
            <p className="mt-3 text-xs text-yellow-300/70">Searching Spotify...</p>
          )}

          {spotifyError && (
            <p className="mt-3 text-xs text-red-300">{spotifyError}</p>
          )}

          {!spotifyLoading && !spotifyError && spotifyQuery.trim().length >= 2 && spotifyResults.length === 0 && (
            <p className="mt-3 text-xs text-yellow-300/70">No tracks found.</p>
          )}

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
            {spotifyResults.map((track) => (
              <div
                key={track.id}
                className="rounded-md border border-[#4a341f] bg-[#21160e] p-2"
              >
                <div className="flex items-center gap-2">
                  {track.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.imageUrl} alt={track.album} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-[#3a2a1a]" />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-yellow-100">{track.name}</p>
                    <p className="truncate text-[11px] text-yellow-300/75">{track.artists || "Unknown artist"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSpotifyPreview(track)}
                    className="rounded-md border border-[#6b4b2a] bg-[#2e2014] p-2 text-yellow-100 hover:bg-[#3c2a1a]"
                    title={spotifyPlayingTrackId === track.id ? "Pause preview" : "Play preview"}
                  >
                    {spotifyPlayingTrackId === track.id ? <Pause size={14} /> : <Play size={14} />}
                  </button>

                  {track.spotifyUrl && (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-[#6b4b2a] bg-[#2e2014] p-2 text-yellow-100 hover:bg-[#3c2a1a]"
                      title="Open in Spotify"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-yellow-300/70">
        {members.length} users in this space
      </div>

      {/* User Section */}
      <div className="mt-auto">
        <SidebarUser />
      </div>
    </div>
  );
}
