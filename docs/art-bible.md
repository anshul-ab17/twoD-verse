# Verse Art Bible (starter)

Per master plan §27. This is the discipline doc; the style doc grows with the artist.

## Art direction

TBD with first artist hire/commission. Placeholder pillars to pressure-test:

- One coherent style across avatars, tilesets, cosmetics, UI — no mixed-source look.
- Readable at gather-town camera distance; silhouettes first.
- Modular avatar parts (body/hair/outfit) so cosmetics compose, not replace.

Until then, spike art is programmatic (Pixi Graphics), registered in the manifest
as `origin: in-house`, `path: programmatic:pixi-graphics`.

## Ownership rules (non-negotiable)

- **No third-party art in production.** No stock tilesets, no licensed sprite atlases (v1's adam/ash/lucy/nancy are dropped).
- **Every asset has provenance** in `packages/assets/manifest.json`: `origin` (in-house | commissioned | ugc) and `license` (owned | revenue-share). CI rejects anything without it.
- **Artist contracts are work-for-hire** — IP assigned to the company. No exceptions for commissions.
- **UGC (V3) is revenue-share**: creators license assets *to* Verse with resale terms; Verse retains platform distribution rights. `origin: ugc` must carry `license: revenue-share` — the validator enforces this.

## Pipeline

```
concept (this bible)
  → source art (Aseprite / Blender / Spine)
  → TexturePacker → sprite atlases + JSON
  → asset registry (packages/assets manifest: id, provenance, rarity, tags)
  → S3/R2 → CDN edge (versioned, cache-busted)
  → runtime loader (Pixi Assets), LOD + lazy chunks
```

MVP implements the registry + CI gate; storage/CDN/loader stages land with the first real asset drop.

## How to add an asset

1. Drop the file under `assets/` (or reference programmatic art as `programmatic:<ref>`).
2. Add an entry to `packages/assets/manifest.json` — id (kebab-case), kind, path, origin, license, tags.
3. `pnpm --filter @repo/assets run validate` must pass. CI blocks the merge otherwise.
