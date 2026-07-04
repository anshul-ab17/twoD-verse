import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // net-schema is published as raw TS; Next compiles it (incl. decorators)
  transpilePackages: ["@repo/net-schema"],
}

export default nextConfig
