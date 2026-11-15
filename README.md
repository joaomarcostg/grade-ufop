# Grade UFOP

**Live at [grade-ufop-puce.vercel.app](https://grade-ufop-puce.vercel.app)**

Helps UFOP students plan their semester: mark what they already passed, see how
far they are from graduating, and build timetables without clashes and within
the university's weekly class-hour limit.

## About

This is my TCC (*Trabalho de Conclusão de Curso*, the final undergraduate
project) at the Universidade Federal de Ouro Preto (UFOP), by
[João Marcos](https://github.com/joaomarcostg).

It started in 2023 as a Next.js app fed by a Selenium scraper
([grade-ufop-scrapper](https://github.com/joaomarcostg/grade-ufop-scrapper)),
and was rebuilt in 2026 as this monorepo: a deterministic data pipeline that
covers every UFOP program, and a planner that runs in the browser, with no
account needed.

- **Progress:** mark passed subjects one by one, by period, or by importing the
  transcript PDF from minhaUFOP (read in the browser, never uploaded). Shows the
  hours left in each category and which subjects unlock the most.
- **Planner:** pick subjects and get up to three clash-free timetables that fit
  the weekly limit (32 class hours in most programs, editable), dropping the
  lowest-priority subjects first; then save them to compare.
- **"Como funciona":** a guided tour of each page for first-time users.

It is not an official UFOP service. The data comes from UFOP's public timetable
and curriculum pages; always check the academic system before enrolling. The
data layer is built so other universities can be added as adapters.

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
