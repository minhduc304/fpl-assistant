# api

Rails 8.1 API-only backend. Owns all FPL public API access, caching, and Postgres (Neon in production). See the repo-root [README.md](../README.md) for the overall project layout and [openapi.yaml](../openapi.yaml) for the contract this app implements.

## Local dev setup

Secrets (`DATABASE_URL` for production/shared Neon) live in the repo-root `.env.local`, gitignored, shared with `apps/web`. For local development and tests, override it with a local Postgres instead of hitting Neon directly:

1. Start the local Postgres container (also used by `apps/web`'s dev server):
   ```bash
   docker compose up -d
   ```
2. Point local dev at it — create `.env.development.local` at the repo root (gitignored):
   ```bash
   echo 'DATABASE_URL="postgres://fpl:fpl@localhost:5433/fpl_api_development"' > ../.env.development.local
   ```
3. Point the local **test** env at a separate database on the same container — create `.env.test.local` at the repo root (gitignored):
   ```bash
   echo 'DATABASE_URL="postgres://fpl:fpl@localhost:5433/fpl_api_test"' > ../.env.test.local
   ```
4. Create and migrate both databases:
   ```bash
   bin/rails db:create db:migrate
   RAILS_ENV=test bin/rails db:create db:schema:load
   ```
5. Run the server / test suite as usual:
   ```bash
   bin/rails server -p 3000
   bundle exec rspec
   ```

Without step 2/3's override files, `RAILS_ENV` falls back to the shared `.env.local`'s `DATABASE_URL`, which points at the **production** Neon database — don't skip them.

`fpl_api_development` and `fpl_api_test` are separate databases on the same container, so running the test suite never touches (or gets polluted by) local dev data, and vice versa.

CI (`.github/workflows/contract-check.yml`) runs its own ephemeral Postgres service container with its own `DATABASE_URL` — it never touches Neon or needs any of the above.
