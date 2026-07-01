<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a Next.js 16 CRM (Velocity CRM). It needs a local PostgreSQL 17 (run via Docker) plus a seeded DB. Standard commands live in `README.md` (Setup + Scripts) and `package.json`; only the non-obvious caveats are below. The npm dependency refresh (`npm install`, which runs `prisma generate` via postinstall, plus Playwright browsers) is handled by the startup update script — do not repeat it here.

### Starting services (not done by the update script)
- Docker is installed but there is no systemd. Start the daemon yourself once per VM: `sudo dockerd` (run it in a background tmux session). Verify with `docker info`.
- The `ubuntu` user is in the `docker` group, so a fresh login shell can use `docker` without sudo once `dockerd` is running. If you hit a socket permission error, run `sudo chmod 666 /var/run/docker.sock`.
- `.env` is gitignored. If it is missing, run `cp .env.example .env` and set a real `AUTH_SECRET` (`openssl rand -base64 32`). The defaults already point `DATABASE_URL` at the Docker Postgres.
- Bring up the DB and schema/seed with `npm run db:up` then `npm run db:setup` (generate + migrate + seed). Seed login users: `operator@velocity.local` / `changeme-operator` (also admin/manager — see README).
- Dev server: `npm run dev` (http://localhost:3000). The AI panels use a Fake LLM by default; to exercise the contact AI summary/recommendation UI in dev, start with the same flags Playwright uses: `AI_ENABLED=true AI_FEATURE_CONTACT_SUMMARY=true AI_FEATURE_RECOMMENDATION=true LLM_SUMMARY_VENDOR=fake LLM_SUMMARY_MODEL=fake-1 npm run dev`.

### Known pre-existing test failures (not caused by the environment)
- `npm run test:integration` fails at `tests/integration/contact-ai-context.test.ts` because its committed golden snapshot (`tests/integration/fixtures/contact-ai-context-wrapper-golden.json`) pins non-deterministic seed values (auto-generated cuid user IDs and `new Date()`-relative timestamps), so a fresh seed never matches. CI on `main` is red at this same step.
- `npm run test:e2e` runs all Playwright projects against one dev server and leaves 2 failures: the `chromium-no-recommendation` project needs the server started with `AI_FEATURE_RECOMMENDATION=false` (use `npm run test:e2e:no-recommendation` instead), and `contacts/contact-recommendation.spec.ts` fails on the recommendation LIVE-refresh flow. The other 32 e2e specs pass.
