# Grade UFOP

Helps university students plan their semester: pick the subjects they can take
(given their program and what they already passed) and find timetables without
clashes.

Started as a TCC (final undergraduate project) for UFOP; the data layer is built
so other universities can be added as adapters.

## Repository layout

| Path | What it is |
| --- | --- |
| `pipeline/` | `gradesync`, the Python data pipeline: fetches each university's public sources, builds a canonical dataset, loads it into Postgres. See [pipeline/README.md](pipeline/README.md). |
| `packages/db/` | `@grade/db`: Prisma schema and migrations (the only definition of the database tables) and the TypeScript client. |
| `apps/web/` | `@grade/web`: the Next.js 16 app. Reads the catalog from Postgres; everything a student enters stays in their browser. |

## Local setup

```bash
docker compose up -d --wait             # Postgres on localhost:54329
npm install                             # workspace packages
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env.local
npm run migrate:dev -w @grade/db        # create the tables

cd pipeline
python -m venv .venv && .venv/bin/pip install -e '.[dev,db]'
.venv/bin/gradesync fetch ufop --term 2026/2
.venv/bin/gradesync build ufop --term 2026/2
DATABASE_URL=postgresql://grade:grade@localhost:54329/grade \
  .venv/bin/gradesync load out/ufop-2026-2.json --current
cd ..

npm run dev                             # http://localhost:3000
```

## Checks

```bash
npm run lint && npm run typecheck -w @grade/web && npm test   # web
cd pipeline && .venv/bin/ruff check . && .venv/bin/pytest     # pipeline (set DATABASE_URL for the loader tests)
```

## Deploying

1. A Postgres database (e.g. Neon). Apply the schema with
   `DATABASE_URL=… npm run migrate:deploy -w @grade/db`.
2. Load the current term: `gradesync fetch`, `build`, then
   `gradesync load out/ufop-<term>.json --current` with the same `DATABASE_URL`.
3. Vercel project: root directory `apps/web`, environment variable
   `DATABASE_URL` (the pooled connection string). Builds need the database,
   because the home page and one program page are prerendered.

Catalog reads are cached for an hour; after loading a new term, pages pick it
up within that time.
