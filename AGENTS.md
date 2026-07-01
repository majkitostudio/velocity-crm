<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Velocity CRM is a single Next.js 16 app (App Router) backed by PostgreSQL 17 via Prisma. Standard commands live in `README.md` and `package.json` scripts; only the non-obvious cloud caveats are captured here.

- **PostgreSQL runs natively, not Docker.** Docker is unavailable in this environment, so the update script does not use `npm run db:up`/`docker compose`. Postgres 17 is installed and initialized once (persisted in the VM snapshot) with role `postgres`/`postgres` and database `velocity_crm`, matching `.env.example`'s `DATABASE_URL`. If the cluster is not running after a fresh boot, start it with `sudo pg_ctlcluster 17 main start` (check with `sudo pg_lsclusters`).
- **`.env` is required and is git-ignored.** Nearly every Prisma/test command (and `postinstall`'s `prisma generate` via `prisma.config.ts`) reads `DATABASE_URL` from `.env`, and `test:integration` hardcodes `--env-file=.env`. Create it once with `cp .env.example .env` and set a real `AUTH_SECRET` (`openssl rand -base64 32`). The default `LLM_*_VENDOR=fake` gives deterministic AI output — no external LLM keys needed.
- **Apply DB schema + seed after starting Postgres:** `npm run prisma:migrate` then `npm run prisma:seed` (or `npm run db:setup`). Seed users: `operator@velocity.local` / `changeme-operator` (also `admin@`/`manager@`). The seed populates a full operator queue, contacts, orders, and callbacks.
- **E2E tests reuse an already-running dev server** (`reuseExistingServer` when not in CI). `playwright.config.ts`'s `webServer.env` only applies when Playwright starts the server itself, so if you pre-start `npm run dev`, start it with the AI flags (`AI_ENABLED=true AI_FEATURE_CONTACT_SUMMARY=true AI_FEATURE_CONTACT_SUMMARY_REFRESH=true AI_FEATURE_RECOMMENDATION=true AI_FEATURE_RECOMMENDATION_REFRESH=true LLM_SUMMARY_VENDOR=fake LLM_SUMMARY_MODEL=fake-1`) to match. Run `npx playwright install chromium` once.
- **Known pre-existing failures (not environment issues; `main` CI is already red):**
  - `tests/integration/contact-ai-context.test.ts` (golden snapshot) fails on any fresh reseed because the committed golden pins a random operator cuid and date-relative seed timestamps. The other 37 integration tests pass.
  - `tests/e2e/contacts/contact-recommendation.spec.ts` fails: `contact-ai-recommendation-panel.tsx` renders alternative actions without `variant="alternative"`, so they share the `contact-ai-recommendation-primary-action` test id (strict-mode violation). The other 29 e2e tests pass.
