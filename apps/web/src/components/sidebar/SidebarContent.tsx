import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Pause, Play, UserPlus, UserMinus, Wifi, Link, Search, LogOut } from "lucide-react";
import SidebarInviteCard from "./SidebarInviteCard";
import SidebarUser from "./SidebarUser";
import { useSpaceSidebar } from "./SpaceSidebarContext";
import { apiFetch, getApiBaseUrl } from "@/lib/api";

declare global {
  interface Window {
    Spotify: { Player: new (opts: { name: string; getOAuthToken: (cb: (t: string) => void) => void; volume: number }) => SpotifyPlayer }
    onSpotifyWebPlaybackSDKReady: () => void
  }
}
type SpotifyPlayer = {
  connect: () => Promise<boolean>
  disconnect: () => void
  togglePlay: () => Promise<void>
  addListener: (event: string, cb: (data: any) => void) => void
}

type SpotifyTrack = {
  id: string
  name: string
  artists: string
  album: string
  imageUrl: string | null
  previewUrl: string | null
  spotifyUrl: string | null
}

type GlobalUser = {
  id: string
  email: string
}

function SpotifyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

interface Props {
  toggle: () => void;
}

export default function SidebarContent({ toggle }: Props) {
  const {
    spaceId,
    activePane,
    activatePane,
    currentUser,
    members,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    notifications,
    openChatWithUser,
    friends,
    addFriend,
    removeFriend,
    isFriend,
  } = useSpaceSidebar()

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const globalSearchRef = useRef<HTMLInputElement | null>(null)
  const spotifyPlayerRef = useRef<SpotifyPlayer | null>(null)

  // Spotify auth
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null)
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(null)
  const [spotifyExpiresAt, setSpotifyExpiresAt] = useState(0)
  const [spotifyDeviceId, setSpotifyDeviceId] = useState<string | null>(null)
  const [spotifyPlayerReady, setSpotifyPlayerReady] = useState(false)
  const [spotifyCurrentUri, setSpotifyCurrentUri] = useState<string | null>(null)
  const [spotifyIsPlaying, setSpotifyIsPlaying] = useState(false)

  // Spotify search
  const [spotifyQuery, setSpotifyQuery] = useState("")
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([])
  const [spotifyLoading, setSpotifyLoading] = useState(false)
  const [spotifyError, setSpotifyError] = useState("")

  // Global user search
  const [globalQuery, setGlobalQuery] = useState("")
  const [globalResults, setGlobalResults] = useState<GlobalUser[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const otherMembers = useMemo(
    () => filteredMembers.filter((m) => m.id !== currentUser?.id),
    [currentUser?.id, filteredMembers]
  )

  const panelTitle =
    activePane === "chat" ? "Chat"
    : activePane === "search" ? "Search"
    : activePane === "notifications" ? "Notifications"
    : activePane === "spotify" ? "Spotify"
    : activePane === "friends" ? "Friends"
    : "Home"

  // Focus search input when pane opens
  useEffect(() => {
    if (activePane === "search") searchInputRef.current?.focus()
  }, [activePane])

  useEffect(() => {
    if (activePane === "search") globalSearchRef.current?.focus()
  }, [activePane])

  // Global user search debounce
  useEffect(() => {
    const q = globalQuery.trim()
    if (q.length < 2) { setGlobalResults([]); return }
    setGlobalLoading(true)
    const t = window.setTimeout(async () => {
      try {
        const payload = await apiFetch<{ users: GlobalUser[] }>(`/api/users/search?q=${encodeURIComponent(q)}`)
        setGlobalResults(Array.isArray(payload.users) ? payload.users : [])
      } catch {
        setGlobalResults([])
      } finally {
        setGlobalLoading(false)
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [globalQuery])

  // Spotify: pick up token from URL params (after OAuth callback) or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("spotify_token")
    const refresh = params.get("spotify_refresh")
    const expiresIn = Number(params.get("spotify_expires_in") || 3600)

    if (token && refresh) {
      const expiresAt = Date.now() + expiresIn * 1000
      setSpotifyToken(token)
      setSpotifyRefreshToken(refresh)
      setSpotifyExpiresAt(expiresAt)
      localStorage.setItem("spotify_token", token)
      localStorage.setItem("spotify_refresh", refresh)
      localStorage.setItem("spotify_expires_at", String(expiresAt))
      const url = new URL(window.location.href)
      url.searchParams.delete("spotify_token")
      url.searchParams.delete("spotify_refresh")
      url.searchParams.delete("spotify_expires_in")
      window.history.replaceState({}, "", url.toString())
      return
    }

    const storedToken = localStorage.getItem("spotify_token")
    const storedRefresh = localStorage.getItem("spotify_refresh")
    const storedExpiry = Number(localStorage.getItem("spotify_expires_at") || 0)

    if (storedToken && Date.now() < storedExpiry - 30_000) {
      setSpotifyToken(storedToken)
      setSpotifyRefreshToken(storedRefresh)
      setSpotifyExpiresAt(storedExpiry)
    } else if (storedRefresh) {
      void (async () => {
        try {
          const data = await apiFetch<{ access_token: string; expires_in: number }>("/api/spotify/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: storedRefresh }),
          })
          const expiresAt = Date.now() + data.expires_in * 1000
          setSpotifyToken(data.access_token)
          setSpotifyRefreshToken(storedRefresh)
          setSpotifyExpiresAt(expiresAt)
          localStorage.setItem("spotify_token", data.access_token)
          localStorage.setItem("spotify_expires_at", String(expiresAt))
        } catch {
          localStorage.removeItem("spotify_token")
          localStorage.removeItem("spotify_refresh")
          localStorage.removeItem("spotify_expires_at")
        }
      })()
    }
  }, [])

  // Spotify: load Web Playback SDK when token is available
  useEffect(() => {
    if (!spotifyToken) return

    const initPlayer = () => {
      const player = new window.Spotify.Player({
        name: "TwoDverse",
        getOAuthToken: (cb) => cb(spotifyToken),
        volume: 0.5,
      })
      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        setSpotifyDeviceId(device_id)
        setSpotifyPlayerReady(true)
      })
      player.addListener("not_ready", () => setSpotifyPlayerReady(false))
      player.addListener("player_state_changed", (state: { paused: boolean; track_window?: { current_track?: { uri?: string } } } | null) => {
        if (!state) return
        setSpotifyCurrentUri(state.track_window?.current_track?.uri ?? null)
        setSpotifyIsPlaying(!state.paused)
      })
      player.connect()
      spotifyPlayerRef.current = player
    }

    if (window.Spotify) {
      initPlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer
      if (!document.getElementById("spotify-sdk")) {
        const script = document.createElement("script")
        script.id = "spotify-sdk"
        script.src = "https://sdk.scdn.co/spotify-player.js"
        script.async = true
        document.head.appendChild(script)
      }
    }

    return () => {
      spotifyPlayerRef.current?.disconnect()
      spotifyPlayerRef.current = null
      setSpotifyPlayerReady(false)
      setSpotifyDeviceId(null)
    }
  }, [spotifyToken])

  // Spotify: search debounce
  useEffect(() => {
    if (activePane !== "spotify" || !spotifyToken) return
    const q = spotifyQuery.trim()
    if (q.length < 2) { setSpotifyResults([]); setSpotifyError(""); setSpotifyLoading(false); return }
    const t = window.setTimeout(async () => {
      setSpotifyLoading(true); setSpotifyError("")
      try {
        const payload = await apiFetch<{ tracks: SpotifyTrack[] }>(
          `/api/spotify/search?q=${encodeURIComponent(q)}`,
          { headers: { "x-spotify-token": spotifyToken } }
        )
        setSpotifyResults(Array.isArray(payload.tracks) ? payload.tracks : [])
      } catch (e) {
        setSpotifyError(e instanceof Error ? e.message : "Spotify search failed")
      } finally {
        setSpotifyLoading(false)
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [activePane, spotifyQuery, spotifyToken])

  const connectSpotify = () => {
    const returnTo = window.location.href
    window.location.href = `${getApiBaseUrl()}/api/spotify/auth?return_to=${encodeURIComponent(returnTo)}`
  }

  const disconnectSpotify = () => {
    spotifyPlayerRef.current?.disconnect()
    spotifyPlayerRef.current = null
    setSpotifyToken(null)
    setSpotifyRefreshToken(null)
    setSpotifyDeviceId(null)
    setSpotifyPlayerReady(false)
    setSpotifyResults([])
    setSpotifyCurrentUri(null)
    localStorage.removeItem("spotify_token")
    localStorage.removeItem("spotify_refresh")
    localStorage.removeItem("spotify_expires_at")
  }

  const playTrack = async (track: SpotifyTrack) => {
    if (!spotifyToken || !spotifyDeviceId) return
    const uri = `spotify:track:${track.id}`
    if (spotifyCurrentUri === uri) {
      await spotifyPlayerRef.current?.togglePlay()
      return
    }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${spotifyToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri] }),
    })
  }

  const copyInviteLink = (userId: string) => {
    const link = `${window.location.origin}/dashboard/spaces/${spaceId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(userId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const addGlobalFriend = (u: GlobalUser) => {
    addFriend({ id: u.id, name: u.email.split("@")[0], email: u.email })
  }

  const border = "var(--card-border)"
  const cardBg = "var(--bg)"
  const text = "var(--text)"
  const muted = "var(--text-muted)"
  const accent = "var(--accent)"

  return (
    <div className="flex flex-col h-full p-4" style={{ color: text }}>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold" style={{ color: text }}>{panelTitle}</h1>
      </div>

      {/* Map / home pane */}
      {activePane === "map" && <SidebarInviteCard />}

      {/* ── SEARCH PANE ── */}
      {activePane === "search" && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">

          {/* Global user search */}
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-2 font-semibold" style={{ color: muted }}>
              Find any user
            </p>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
              <input
                ref={globalSearchRef}
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                placeholder="Search by email…"
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none"
                style={{ background: cardBg, borderColor: border, color: text }}
              />
            </div>

            {globalLoading && (
              <p className="mt-2 text-xs" style={{ color: muted }}>Searching…</p>
            )}

            {!globalLoading && globalQuery.trim().length >= 2 && globalResults.length === 0 && (
              <p className="mt-2 text-xs" style={{ color: muted }}>No users found.</p>
            )}

            {globalResults.length > 0 && (
              <div className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: border }}>
                {globalResults.map((u) => {
                  const alreadyFriend = isFriend(u.id)
                  const inSpace = members.some((m) => m.id === u.id)
                  const copied = copiedId === u.id
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 border-b last:border-0"
                      style={{ borderColor: border, background: "var(--bg-card)" }}
                    >
                      {/* Avatar initial */}
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: "var(--accent-bg)", color: accent }}
                      >
                        {u.email[0]?.toUpperCase()}
                      </div>

                      {/* Email + status */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: text }}>
                          {u.email.split("@")[0]}
                        </p>
                        <p className="truncate text-[11px]" style={{ color: muted }}>{u.email}</p>
                        {inSpace && (
                          <span className="text-[10px] font-semibold" style={{ color: "#4ade80" }}>● in space</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Add / remove friend */}
                        <button
                          type="button"
                          title={alreadyFriend ? "Remove friend" : "Add friend"}
                          onClick={() => alreadyFriend ? removeFriend(u.id) : addGlobalFriend(u)}
                          className="rounded-md p-1.5 transition"
                          style={{ background: "var(--bg)", border: `1px solid ${border}` }}
                        >
                          {alreadyFriend
                            ? <UserMinus size={13} style={{ color: "#f87171" }} />
                            : <UserPlus size={13} style={{ color: accent }} />
                          }
                        </button>

                        {/* Copy invite link */}
                        <button
                          type="button"
                          title={copied ? "Copied!" : "Copy invite link"}
                          onClick={() => copyInviteLink(u.id)}
                          className="rounded-md p-1.5 transition"
                          style={{
                            background: copied ? "var(--accent-bg)" : "var(--bg)",
                            border: `1px solid ${copied ? accent : border}`,
                            color: copied ? accent : muted,
                          }}
                        >
                          <Link size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* In-space member search */}
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-2 font-semibold" style={{ color: muted }}>
              People in this space
            </p>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: muted }} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter members…"
                className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none"
                style={{ background: cardBg, borderColor: border, color: text }}
              />
            </div>

            <div className="mt-2 rounded-lg border overflow-y-auto max-h-48" style={{ borderColor: border }}>
              {otherMembers.length === 0 ? (
                <p className="p-3 text-xs" style={{ color: muted }}>No members found.</p>
              ) : (
                otherMembers.map((member) => (
                  <button
                    key={member.id}
                    className="flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm transition last:border-0"
                    style={{ borderColor: border, background: "var(--bg-card)", color: text }}
                    onClick={() => {
                      openChatWithUser(member.id)
                      if (typeof window !== "undefined" && window.innerWidth < 1024) toggle()
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                      <span className="truncate">{member.name}</span>
                    </div>
                    <span className="text-[11px] shrink-0" style={{ color: muted }}>chat</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FRIENDS PANE ── */}
      {activePane === "friends" && (
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-4">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide font-semibold" style={{ color: muted }}>
              Online in space ({members.filter((m) => m.id !== currentUser?.id).length})
            </p>
            <div className="rounded-lg border max-h-40 overflow-y-auto" style={{ borderColor: border, background: cardBg }}>
              {members.filter((m) => m.id !== currentUser?.id).length === 0 ? (
                <p className="p-3 text-xs" style={{ color: muted }}>No one else here yet.</p>
              ) : (
                members.filter((m) => m.id !== currentUser?.id).map((member) => (
                  <div key={member.id} className="flex items-center justify-between px-3 py-2 border-b last:border-0" style={{ borderColor: border }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-sm truncate" style={{ color: text }}>{member.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => isFriend(member.id) ? removeFriend(member.id) : addFriend(member)}
                      title={isFriend(member.id) ? "Remove friend" : "Add friend"}
                      className="ml-2 rounded p-1 transition"
                    >
                      {isFriend(member.id)
                        ? <UserMinus size={13} style={{ color: "#f87171" }} />
                        : <UserPlus size={13} style={{ color: accent }} />
                      }
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide font-semibold" style={{ color: muted }}>
              Friends ({friends.length})
            </p>
            <div className="rounded-lg border max-h-56 overflow-y-auto" style={{ borderColor: border, background: cardBg }}>
              {friends.length === 0 ? (
                <p className="p-3 text-xs" style={{ color: muted }}>No friends yet. Use Search to find people.</p>
              ) : (
                friends.map((friend) => {
                  const online = members.some((m) => m.id === friend.id)
                  return (
                    <div key={friend.id} className="flex items-center justify-between px-3 py-2 border-b last:border-0" style={{ borderColor: border }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${online ? "bg-green-400" : "bg-zinc-600"}`} />
                        <span className="text-sm truncate" style={{ color: text }}>{friend.name}</span>
                        {online && <Wifi size={10} className="text-green-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {online && (
                          <button type="button" onClick={() => openChatWithUser(friend.id)} className="rounded p-1 text-xs" style={{ color: accent }}>
                            chat
                          </button>
                        )}
                        <button type="button" onClick={() => removeFriend(friend.id)} className="rounded p-1 transition">
                          <UserMinus size={13} style={{ color: "#f87171" }} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activePane === "notifications" && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border" style={{ borderColor: border, background: cardBg }}>
          {notifications.length === 0 ? (
            <p className="p-3 text-xs" style={{ color: muted }}>No new activity.</p>
          ) : (
            notifications.map((entry) => (
              <div key={entry.id} className="border-b px-3 py-2 last:border-0" style={{ borderColor: border }}>
                <p className="text-sm" style={{ color: text }}>{entry.message}</p>
                <p className="text-[11px]" style={{ color: muted }}>
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CHAT INFO ── */}
      {activePane === "chat" && (
        <div className="mt-3 rounded-lg border p-3 text-sm" style={{ borderColor: border, background: cardBg }}>
          <p className="font-medium" style={{ color: text }}>Chat mode active</p>
          <p className="mt-1 text-xs" style={{ color: muted }}>Use the map icon to return to map view.</p>
        </div>
      )}

      {/* ── SPOTIFY ── */}
      {activePane === "spotify" && (
        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-lg border p-3" style={{ borderColor: border, background: cardBg }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: "#1DB954" }}><SpotifyIcon size={18} /></span>
              <span className="text-xs font-semibold" style={{ color: "#1DB954" }}>Spotify</span>
            </div>
            {spotifyToken && (
              <button type="button" onClick={disconnectSpotify} title="Disconnect Spotify"
                className="rounded p-1 transition" style={{ color: muted }}>
                <LogOut size={13} />
              </button>
            )}
          </div>

          {/* Not connected */}
          {!spotifyToken && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <SpotifyIcon size={40} />
              <p className="text-sm font-medium" style={{ color: text }}>Connect your Spotify</p>
              <p className="text-xs" style={{ color: muted }}>Play full tracks using your own Spotify Premium account.</p>
              <button
                type="button"
                onClick={connectSpotify}
                className="mt-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "#1DB954" }}
              >
                Connect Spotify
              </button>
            </div>
          )}

          {/* Connected but player not ready */}
          {spotifyToken && !spotifyPlayerReady && (
            <p className="text-xs mt-2" style={{ color: muted }}>Connecting player…</p>
          )}

          {/* Connected + player ready */}
          {spotifyToken && spotifyPlayerReady && (
            <>
              <input
                value={spotifyQuery}
                onChange={(e) => setSpotifyQuery(e.target.value)}
                placeholder="Search songs or artists"
                className="rounded-md border px-3 py-2 text-sm outline-none"
                style={{ background: "var(--bg)", borderColor: border, color: text }}
              />
              <p className="mt-1 text-[10px]" style={{ color: muted }}>Requires Spotify Premium</p>
              {spotifyLoading && <p className="mt-3 text-xs" style={{ color: muted }}>Searching Spotify…</p>}
              {spotifyError && <p className="mt-3 text-xs" style={{ color: "#f87171" }}>{spotifyError}</p>}
              {!spotifyLoading && !spotifyError && spotifyQuery.trim().length >= 2 && spotifyResults.length === 0 && (
                <p className="mt-3 text-xs" style={{ color: muted }}>No tracks found.</p>
              )}
              <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
                {spotifyResults.map((track) => {
                  const uri = `spotify:track:${track.id}`
                  const isActive = spotifyCurrentUri === uri
                  return (
                    <div key={track.id} className="rounded-md border p-2" style={{ borderColor: border, background: "var(--bg)" }}>
                      <div className="flex items-center gap-2">
                        {track.imageUrl
                          ? <img src={track.imageUrl} alt={track.album} className="h-10 w-10 rounded object-cover" /> // eslint-disable-line @next/next/no-img-element
                          : <div className="h-10 w-10 rounded" style={{ background: "var(--bg-card)" }} />
                        }
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm" style={{ color: isActive ? "#1DB954" : text }}>{track.name}</p>
                          <p className="truncate text-[11px]" style={{ color: muted }}>{track.artists || "Unknown artist"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void playTrack(track)}
                          className="rounded-md border p-2 transition"
                          style={{ borderColor: isActive ? "#1DB954" : border, background: "var(--bg-card)", color: isActive ? "#1DB954" : text }}
                        >
                          {isActive && spotifyIsPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        {track.spotifyUrl && (
                          <a href={track.spotifyUrl} target="_blank" rel="noreferrer"
                            className="rounded-md border p-2 transition"
                            style={{ borderColor: border, background: "var(--bg-card)", color: "#1DB954" }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-4 text-xs" style={{ color: muted }}>{members.length} users in this space</div>

      <div className="mt-auto"><SidebarUser /></div>
    </div>
  )
}
