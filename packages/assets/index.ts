// Asset registry schemas (master plan §27): every asset carries a provenance
// record, and CI rejects anything without clear owned/licensed provenance.

import { z } from "zod"

export const ASSET_KINDS = ["avatar", "tileset", "cosmetic", "emote", "audio", "ui"] as const
export const ASSET_ORIGINS = ["in-house", "commissioned", "ugc"] as const
export const ASSET_LICENSES = ["owned", "revenue-share"] as const
export const ASSET_RARITIES = ["common", "rare", "epic", "legendary"] as const

/** §27 provenance rule as code: ugc → revenue-share; in-house/commissioned → owned. */
export function licenseValidFor(origin: (typeof ASSET_ORIGINS)[number], license: (typeof ASSET_LICENSES)[number]): boolean {
  return license === (origin === "ugc" ? "revenue-share" : "owned")
}

export const AssetEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a kebab-case slug"),
    kind: z.enum(ASSET_KINDS),
    // Relative path under assets/ (no leading / or ..), or "programmatic:<ref>"
    // for spike art drawn in code (Pixi Graphics) with no source file yet.
    path: z
      .string()
      .min(1)
      .refine(
        (p) => p.startsWith("programmatic:") || (!p.startsWith("/") && !p.includes("..") && !/^[A-Za-z]:/.test(p)),
        "path must be relative (under assets/) or programmatic:<ref>",
      ),
    origin: z.enum(ASSET_ORIGINS),
    license: z.enum(ASSET_LICENSES),
    rarity: z.enum(ASSET_RARITIES).optional(),
    tags: z.array(z.string()),
  })
  .refine((e) => licenseValidFor(e.origin, e.license), {
    message: "provenance violation (§27): ugc must be revenue-share; in-house/commissioned must be owned",
    path: ["license"],
  })

export type AssetEntry = z.infer<typeof AssetEntrySchema>

export const AssetManifestSchema = z
  .array(AssetEntrySchema)
  .refine((entries) => new Set(entries.map((e) => e.id)).size === entries.length, "duplicate asset ids in manifest")

export type AssetManifest = z.infer<typeof AssetManifestSchema>

/** Parse an unknown JSON value into a typed manifest. Throws ZodError on invalid input. */
export function parseManifest(json: unknown): AssetManifest {
  return AssetManifestSchema.parse(json)
}
