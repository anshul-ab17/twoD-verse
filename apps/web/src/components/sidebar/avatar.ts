export function getUserInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return "?"

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase()
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase()
}

const AVATAR_COLORS = [
  "#facc15",
  "#4ade80",
  "#fb7185",
  "#60a5fa",
  "#c084fc",
  "#fb923c",
]

export function getAvatarColor(seed: string) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function escapeForSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function getGeneratedAvatarDataUrl(name: string, seed: string) {
  const color = getAvatarColor(seed)
  const initials = getUserInitials(name)
  const safeInitials = escapeForSvg(initials)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="${color}" rx="48" ry="48"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="36" font-weight="700">${safeInitials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
