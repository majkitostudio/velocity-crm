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
- Prisma 7 + PostgreSQL (Supabase)
- Auth.js (credentials, JWT)
- Tailwind CSS v4, Zod

## Prerequisites

- Node.js 20+
- PostgreSQL database (local or Supabase)

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

3. **Database migrate & seed**

   ```bash
   npm run db:setup
   ```

   Or step by step:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. **Start development server**

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

After `npm run db:setup`, the seed also creates demo contacts, a due callback, call history, and notes so you can log in as the operator and work the queue immediately.

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
| `npm run db:setup` | Migrate + seed |

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
