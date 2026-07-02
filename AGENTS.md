<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a Next.js 16 CRM (Velocity CRM). It needs a local PostgreSQL 17 plus a seeded DB. Standard commands live in `README.md` (Setup + Scripts) and `package.json`; only the non-obvious caveats are below. The npm dependency refresh (`npm install`, which runs `prisma generate` via postinstall, plus Playwright browsers) is handled by the startup update script — do not repeat it here.

### Starting services (not done by the update script)
- PostgreSQL 17 is required and must match `.env`'s `DATABASE_URL` (`postgres` / `postgres` @ `localhost:5432`, database `velocity_crm`).
  - **If Docker is available:** there is no systemd, so start the daemon yourself once per VM: `sudo dockerd` (run it in a background tmux session; verify with `docker info`). Then bring up the DB with `npm run db:up`. If you hit a socket permission error, run `sudo chmod 666 /var/run/docker.sock`. The `ubuntu` user is in the `docker` group.
  - **If Docker is NOT available** (e.g. `docker: command not found`): run Postgres natively instead — `sudo pg_ctlcluster 17 main start` (installed via the `postgresql-17` package; check with `sudo pg_lsclusters`).
- `.env` is gitignored. If it is missing, run `cp .env.example .env` and set a real `AUTH_SECRET` (`openssl rand -base64 32`). The defaults already point `DATABASE_URL` at `localhost:5432` and use a Fake LLM, so no external LLM keys are needed.
- Apply schema + seed with `npm run db:setup` (generate + migrate + seed), or step by step `npm run prisma:migrate` then `npm run prisma:seed`. Seed login users: `operator@velocity.local` / `changeme-operator` (also admin/manager — see README).
- Dev server: `npm run dev` (http://localhost:3000). The AI panels use a Fake LLM by default; to exercise the contact AI summary/recommendation UI in dev, start with the same flags Playwright uses: `AI_ENABLED=true AI_FEATURE_CONTACT_SUMMARY=true AI_FEATURE_CONTACT_SUMMARY_REFRESH=true AI_FEATURE_RECOMMENDATION=true AI_FEATURE_RECOMMENDATION_REFRESH=true LLM_SUMMARY_VENDOR=fake LLM_SUMMARY_MODEL=fake-1 npm run dev`.

### Testing caveats
- Integration tests hardcode `--env-file=.env`, so `.env` must exist before `npm run test:integration` (CI creates it from its `env:` block; locally use `cp .env.example .env`).
- `npm run test:e2e` runs all Playwright projects against one shared dev server, reusing an already-running one when not in CI. The `chromium-no-recommendation` project asserts the recommendation panel is hidden and only passes when the server was started with `AI_FEATURE_RECOMMENDATION=false`; it therefore fails in the default combined run (server flag on). Run it separately against a server started with the flag off: start `... AI_FEATURE_RECOMMENDATION=false npm run dev`, then `npx playwright test --project=chromium-no-recommendation`.
