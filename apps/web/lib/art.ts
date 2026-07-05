// Owned SVG art kit (plan §27): every sprite is hand-authored vector code in
// this repo — provenance in-house/owned, registered in packages/assets.
// ponytail: flat cartoon style; commissioned pixel art slots in via the same
// texture loader when it exists.

import { Assets, Texture } from "pixi.js"

const cache = new Map<string, Promise<Texture>>()

function svgTexture(key: string, svg: string): Promise<Texture> {
  let p = cache.get(key)
  if (!p) {
    const url = `data:image/svg+xml;base64,${btoa(svg)}`
    p = Assets.load<Texture>({ src: url, data: { resolution: 2 } })
    cache.set(key, p)
  }
  return p
}

// --- avatar kit: skin x hair-style x hair-color x shirt variants ------------

const SKINS = ["#f1d3b3", "#e0ac69", "#c68642", "#8d5524"]
const HAIR_COLORS = ["#2b2b2b", "#5a3825", "#b55239", "#d9b380", "#4a4e69"]
const SHIRTS = ["#e4572e", "#29c7ac", "#f3a712", "#5b8dee", "#c74fd1", "#8bc34a"]

const HAIR_STYLES = [
  // short crop
  (c: string) => `<path d="M11 12 Q11 2 22 2 Q33 2 33 12 L33 14 Q22 8 11 14 Z" fill="${c}"/>`,
  // side sweep
  (c: string) => `<path d="M10 14 Q9 1 24 2 Q35 3 34 15 L30 10 Q20 4 12 12 Z" fill="${c}"/>`,
  // long bob
  (c: string) =>
    `<path d="M10 12 Q11 1 22 1 Q33 1 34 12 L35 24 Q33 26 31 24 L30 12 Q22 6 14 12 L13 24 Q11 26 9 24 Z" fill="${c}"/>`,
]

function hashOf(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic per-user avatar texture (44x64 viewBox, feet at bottom). */
export function avatarTexture(userId: string): Promise<Texture> {
  const h = hashOf(userId)
  const skin = SKINS[h % SKINS.length]!
  // >>> not >>: h is uint32, a signed shift goes negative for h >= 2^31 and
  // a negative index reads undefined (crashed avatar creation for ~half of ids)
  const hair = HAIR_STYLES[(h >>> 2) % HAIR_STYLES.length]!
  const hairColor = HAIR_COLORS[(h >>> 4) % HAIR_COLORS.length]!
  const shirt = SHIRTS[(h >>> 7) % SHIRTS.length]!
  const pants = "#3a3f58"

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="64" viewBox="0 0 44 64">
  <ellipse cx="22" cy="60" rx="13" ry="3.5" fill="rgba(0,0,0,.25)"/>
  <rect x="15" y="44" width="5.5" height="14" rx="2.5" fill="${pants}"/>
  <rect x="23.5" y="44" width="5.5" height="14" rx="2.5" fill="${pants}"/>
  <rect x="12" y="24" width="20" height="23" rx="8" fill="${shirt}"/>
  <rect x="8.5" y="26" width="5" height="15" rx="2.5" fill="${shirt}"/>
  <rect x="30.5" y="26" width="5" height="15" rx="2.5" fill="${shirt}"/>
  <circle cx="11" cy="42.5" r="2.6" fill="${skin}"/>
  <circle cx="33" cy="42.5" r="2.6" fill="${skin}"/>
  <circle cx="22" cy="13" r="10" fill="${skin}"/>
  ${hair(hairColor)}
</svg>`
  return svgTexture(`avatar:${skin}:${hairColor}:${shirt}:${(h >>> 2) % HAIR_STYLES.length}`, svg)
}

// --- office furniture --------------------------------------------------------

const FURNITURE: Record<string, string> = {
  desk: `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="64" viewBox="0 0 88 64">
  <rect x="2" y="10" width="84" height="40" rx="5" fill="#6b4f35"/>
  <rect x="2" y="10" width="84" height="6" rx="3" fill="#7d5d40"/>
  <rect x="10" y="18" width="34" height="20" rx="2" fill="#20242f"/>
  <rect x="12" y="20" width="30" height="16" rx="1" fill="#9fd0e8"/>
  <rect x="24" y="38" width="6" height="5" fill="#454b6b"/>
  <rect x="52" y="24" width="24" height="14" rx="2" fill="#51576f"/>
  <rect x="54" y="40" width="20" height="3" rx="1.5" fill="#3c415c"/>
</svg>`,
  chair: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 30 34">
  <ellipse cx="15" cy="31" rx="11" ry="2.5" fill="rgba(0,0,0,.2)"/>
  <rect x="4" y="2" width="22" height="10" rx="4" fill="#51576f"/>
  <rect x="5" y="12" width="20" height="14" rx="5" fill="#5d6480"/>
  <rect x="13" y="24" width="4" height="7" fill="#3c415c"/>
</svg>`,
  sofa: `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="42" viewBox="0 0 120 42">
  <rect x="0" y="4" width="120" height="30" rx="10" fill="#7a3b4f"/>
  <rect x="6" y="10" width="52" height="16" rx="6" fill="#8f4a60"/>
  <rect x="62" y="10" width="52" height="16" rx="6" fill="#8f4a60"/>
  <rect x="0" y="26" width="120" height="12" rx="6" fill="#6b3345"/>
</svg>`,
  plant: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <ellipse cx="18" cy="41" rx="12" ry="2.5" fill="rgba(0,0,0,.2)"/>
  <path d="M12 40 L24 40 L26 28 L10 28 Z" fill="#8a5a33"/>
  <path d="M18 28 Q6 22 8 8 Q17 12 18 26 Q19 10 29 6 Q31 20 18 28" fill="#3f8f4e"/>
  <path d="M18 27 Q13 16 18 8 Q23 16 18 27" fill="#2f6b3a"/>
</svg>`,
  meetingTable: `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="84" viewBox="0 0 180 84">
  <rect x="2" y="6" width="176" height="72" rx="18" fill="#6b4f35"/>
  <rect x="8" y="12" width="164" height="60" rx="14" fill="#7d5d40"/>
  <rect x="70" y="34" width="40" height="16" rx="3" fill="#20242f"/>
  <rect x="72" y="36" width="36" height="12" rx="2" fill="#9fd0e8"/>
</svg>`,
}

export function furnitureTexture(kind: keyof typeof FURNITURE & string): Promise<Texture> {
  return svgTexture(`furniture:${kind}`, FURNITURE[kind]!)
}
