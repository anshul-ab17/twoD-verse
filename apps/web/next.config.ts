import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // game-core is published as raw TS; Next compiles it (incl. decorators)
  transpilePackages: ["@repo/game-core"],
}

export default nextConfig
