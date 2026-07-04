# twoDverse (v2)

A living, multiplayer 2.5D world that runs your work. Evolution of v1 — see
`../docs/v2-master-plan.md` for the full plan.

## Stack

- **Monorepo:** pnpm workspaces + Turborepo; Bun runtime in server apps
- **Realtime:** Colyseus (authoritative movement, `apps/realtime`)
- **Media:** LiveKit SFU (token service in `apps/media`)
- **Web:** Next.js 15 + React 19 + PixiJS 8 (`apps/web`)
- **Data:** Postgres (Prisma), Redis

## Prerequisites

- Node ≥ 20, pnpm ≥ 11, Bun ≥ 1.3
- Docker (for Postgres / Redis / LiveKit)

## Setup

```sh
pnpm install
docker compose up -d                          # postgres :5432, redis :6379, livekit :7880 (dev mode)

# db
cp packages/db/.example.env packages/db/.env  # set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/verse
pnpm --filter @repo/db exec prisma migrate dev
pnpm --filter @repo/db exec prisma generate

# media (LiveKit dev-mode credentials: devkey / secret)
cp apps/media/.example.env apps/media/.env    # LIVEKIT_URL=ws://localhost:7880
```

## Run

```sh
pnpm --filter @repo/realtime dev   # Colyseus ws://localhost:2567
pnpm --filter @repo/media dev      # token service http://localhost:2568
pnpm --filter @repo/web dev        # web http://localhost:3000
```

Open two browser tabs on `localhost:3000`, move with WASD/arrows — each tab
sees the other move (server-authoritative, interpolated).

## Checks

```sh
pnpm run check-types                          # tsc across all packages
pnpm run test                                 # vitest unit tests
pnpm --filter @repo/assets run validate      # asset provenance gate (plan §27)
pnpm --filter @repo/realtime test:spike      # two-client movement harness (server must be running)
bun run packages/net-schema/interpolate.ts    # assert self-checks
bun run packages/net-schema/zones.ts
```

## Layout

```
apps/      web (Next+Pixi) · realtime (Colyseus) · media (LiveKit tokens)
packages/  types · db (Prisma) · auth (JWT/Argon2/magic-link/OAuth) ·
           pubsub (Redis) · net-schema (Colyseus schemas + interpolation) ·
           assets (provenance-gated registry) · typescript-config · eslint-config
docs/      art-bible.md
```
