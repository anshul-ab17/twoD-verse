import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { parseManifest } from "./index.ts"

const valid = (over: Record<string, unknown> = {}) => ({
  id: "player-orb",
  kind: "avatar",
  path: "avatars/orb.png",
  origin: "in-house",
  license: "owned",
  tags: ["spike"],
  ...over,
})

describe("parseManifest", () => {
  it("accepts a valid manifest", () => {
    expect(parseManifest([valid()])).toHaveLength(1)
  })

  it("rejects ugc with owned license (§27)", () => {
    expect(() => parseManifest([valid({ origin: "ugc", license: "owned" })])).toThrow(/provenance/)
  })

  it("rejects duplicate ids", () => {
    expect(() => parseManifest([valid(), valid()])).toThrow(/duplicate/)
  })

  it("rejects path traversal", () => {
    expect(() => parseManifest([valid({ path: "../secrets.png" })])).toThrow()
    expect(() => parseManifest([valid({ path: "/etc/passwd" })])).toThrow()
  })

  it("accepts programmatic: paths", () => {
    expect(parseManifest([valid({ path: "programmatic:pixi-graphics" })])).toHaveLength(1)
  })

  it("parses the real manifest.json", () => {
    const json = JSON.parse(readFileSync(new URL("./manifest.json", import.meta.url), "utf8"))
    expect(parseManifest(json).length).toBeGreaterThan(0)
  })
})
