// CI gate (§27): validates manifest.json against the registry schema.
// Rejects any asset without clear owned/licensed provenance. `bun run validate.ts`

import { readFileSync } from "node:fs"
import { AssetEntrySchema, parseManifest } from "./index.ts"

/** Assert-based self-check: the provenance gate must actually reject bad entries. */
function demo() {
  const ugcOwned = AssetEntrySchema.safeParse({
    id: "stolen-hat",
    kind: "cosmetic",
    path: "assets/cosmetics/stolen-hat.png",
    origin: "ugc",
    license: "owned",
    tags: [],
  })
  console.assert(!ugcOwned.success, "ugc+owned must be rejected — provenance gate is broken")

  const dupIds = parseManifestSafe([
    { id: "a", kind: "ui", path: "assets/a.png", origin: "in-house", license: "owned", tags: [] },
    { id: "a", kind: "ui", path: "assets/b.png", origin: "in-house", license: "owned", tags: [] },
  ])
  console.assert(!dupIds, "duplicate ids must be rejected")
}

function parseManifestSafe(json: unknown): boolean {
  try {
    parseManifest(json)
    return true
  } catch {
    return false
  }
}

if (import.meta.main) {
  demo()

  const raw = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8"))
  try {
    const manifest = parseManifest(raw)
    console.log(`assets manifest ok (${manifest.length} entries)`)
  } catch (err) {
    console.error("assets manifest INVALID — fix provenance/schema before merging (§27):")
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
