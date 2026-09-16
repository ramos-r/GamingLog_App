# Gaming Log

A personal game-cataloging web app — multi-user from day one. See `CLAUDE.md`
and `PLAN.md` (project reference folder) for the full brief, decided stack,
and phased build plan.

## Structure

- `client/` — React + TypeScript SPA (Vite), deployed as the static site.
- `server/` — Express + TypeScript API, deployed as Vercel serverless
  functions under `/api` (entry point: `server/api/index.ts`).
- `shared/` — Types shared between `client/` and `server/` (API DTOs,
  derived from Prisma model types) so neither side hand-duplicates them.

## Running locally

1. `npm install` at the repo root (installs all three workspaces).
2. Copy `server/.env.example` to `server/.env` and fill in real values (see
   below) — this is where both `tsx` (via `--env-file`) and the Prisma CLI
   look for it, since commands run with `server/` as the working directory.
3. `npm run dev` — runs `shared` in watch mode, the Vite dev server
   (`client`, on `http://localhost:5173`), and the Express API (`server`,
   on `http://localhost:3001`) together. Vite proxies `/api/*` requests to
   the Express server in dev.

## Environment variables

| Variable | Where it comes from | Used by |
|---|---|---|
| `DATABASE_URL` | Vercel Postgres (Neon) — the **pooled** connection string (hostname contains `-pooler`) | The app's runtime Prisma client. A serverless function spins up a fresh client per cold start, and the direct connection string would exhaust Postgres's connection limit under real traffic. |
| `DIRECT_URL` | Vercel Postgres (Neon) — the direct (non-pooled) connection string | `prisma migrate` / `prisma db seed` only — migrations need a direct connection. |
| `JWT_SECRET` | A random 32+ byte value you generate | Signing/verifying the auth JWT stored in an httpOnly cookie. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (Storage tab of the Vercel project) | Uploading avatars and user-added game cover art. |
| `PORT` | Optional, defaults to `3001` | Local Express dev server port only — unused in production (Vercel manages the port). |

Both connection strings come from the same Vercel Postgres/Neon database,
under the project's Storage tab — Vercel surfaces both a pooled and a
direct URL there.

## Known placeholders

- The `/login` and `/register` background (`.auth-background` in
  `client/src/index.css`) is a CSS gradient standing in for the mockup's
  fantasy-art background, which is copyrighted and not shipped (see
  `CLAUDE.md` → Images). Swap it for a licensed image/illustration whenever
  one is available.

## Other commands

- `npm run build` — builds `shared`, then `client`, then `server`.
- `npm run lint` — lints `client` and `server`.

## Deploy

Push to `main` — once the repo is linked on Vercel, it builds and deploys
automatically per `vercel.json` (static `client/` build + `server/api`
serverless function, with `/api/*` rewritten to it).
