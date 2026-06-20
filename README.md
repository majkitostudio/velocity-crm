# Velocity CRM

AI-first CRM for call centers. Internal V1 with multi-tenant-ready architecture.

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/PROJECT_VISION.md](./docs/PROJECT_VISION.md) | Product vision |
| [docs/TARGET_ARCHITECTURE.md](./docs/TARGET_ARCHITECTURE.md) | Layered architecture standard |
| [docs/WORKFLOW_RULES.md](./docs/WORKFLOW_RULES.md) | Approved operator & call workflow rules |
| [docs/IMPLEMENTATION_SEQUENCE.md](./docs/IMPLEMENTATION_SEQUENCE.md) | Vertical implementation slices |
| [docs/adr/](./docs/adr/) | Architecture decision records |

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript strict
- Prisma 7 + PostgreSQL 17 locally via Docker Compose (Supabase-compatible schema)
- Auth.js (credentials, JWT)
- Tailwind CSS v4, Zod

## Prerequisites

- Node.js 20+
- Docker Desktop for local PostgreSQL 17

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `AUTH_SECRET` | Random secret for Auth.js (e.g. `openssl rand -base64 32`) |

3. **Start local PostgreSQL**

   ```bash
   npm run db:up
   ```

   This starts Docker Compose service `postgres` using container
   `velocity-crm-postgres` on `localhost:5432`.

4. **Database migrate & seed**

   ```bash
   npm run db:setup
   ```

   Or step by step:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Seed users (development only)

Created by `prisma/seed.ts` (ADR-005):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@velocity.local` | `changeme-admin` |
| Manager | `manager@velocity.local` | `changeme-manager` |
| Operator | `operator@velocity.local` | `changeme-operator` |

After `npm run db:setup`, the seed also creates demo contacts, due and future callbacks, call history, orders, active/inactive catalog data, and notes so you can log in as the operator and work the queue immediately.

Change these passwords before any non-local deployment.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:validate` | Validate schema |
| `npm run prisma:migrate` | Run migrations (dev) |
| `npm run prisma:seed` | Seed database |
| `npm run db:up` | Start local PostgreSQL 17 with Docker Compose |
| `npm run db:down` | Stop local Docker Compose services |
| `npm run db:setup` | Generate Prisma client, migrate, and seed |
| `npm run db:reset` | Destructively reset the local database and run seed |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright in UI mode |

## End-to-end tests

Playwright tests live under `tests/e2e`:

```text
tests/e2e/
  auth/
  queue/
  contacts/
  orders/
  callbacks/
  helpers/
  fixtures/
```

Run the full local validation flow:

```bash
npm install
cp .env.example .env
npm run db:up
npm run db:setup
npm run test:e2e
```

The first run may require browser installation:

```bash
npx playwright install
```

Playwright stores trace, screenshot, and video artifacts for failed tests in ignored report folders.

E2E runs use `workers: 1` on purpose. Tests share one Next.js dev server (`npm run dev`); parallel workers caused flaky login redirects and navigation under on-demand compilation. Operator auth is prepared once in `globalSetup` and reused via `storageState`; dedicated auth specs still exercise the real login flow serially.

## Local troubleshooting

- If PostgreSQL is unavailable, check Docker Desktop and `docker compose ps`.
- If port `5432` is already used, stop the conflicting service or adjust your local environment before running `npm run db:up`.
- If local data is stale, run `npm run db:reset`. This is destructive and intended only for local development/testing.
- If Playwright cannot launch Chromium, run `npx playwright install`.

## Project structure

```text
app/                  # Next.js App Router (UI)
src/
  domain/             # Shared types, errors, workflow constants
  server/             # Auth, DB, guards
  features/*/server/  # Business logic (migrating to services/repos)
prisma/
  schema.prisma       # Data model
  seed.ts             # Dev seed (Company + users)
docs/                 # Architecture & product docs
```

## Architecture layers

```
UI → Server Actions → Workflow / Services → Repositories → Prisma → PostgreSQL
```

See [TARGET_ARCHITECTURE.md](./docs/TARGET_ARCHITECTURE.md) for full rules.

## Current implementation status

- **Slice 0 (Foundation):** domain errors, events, workflow constants, seed, Zod, migrations
- **Slice 2 (Operator Dashboard):** operator queue on dashboard with overview, sections, empty/loading/error states
