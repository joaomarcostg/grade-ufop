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
up within that time, or at once through `POST /api/revalidate` (below).

## Keeping the data fresh

`.github/workflows/sync.yml` runs `gradesync refresh`, which loads the term the
site shows and switches to a newer one once UFOP publishes its timetable (with
at least 1000 sections, taking fresh curricula at the switch). It only runs
around matrícula, the only time the data changes in ways students act on:

| When | What |
| --- | --- |
| The week before the first ajuste | Daily, looks for the new term's timetable (one request to UFOP) and switches to it. |
| From the 1st atestado to the atestado definitivo | Every two hours, the timetable only (`--sections-only`, about 50 requests), so seats follow the atestados. |
| Any other time | Nothing. |

The windows come from PROGRAD's academic calendar and live in
[`pipeline/enrollment-windows.txt`](pipeline/enrollment-windows.txt): add the
next year's when the calendar comes out. Raw snapshots are kept in the Actions
cache, so a seats refresh does not download the curricula again. Any mode can
also be run by hand from the Actions tab (*Run workflow*).

Setup:

- GitHub secret `DATABASE_URL`: the database's direct (non-pooled) connection string.
- `REVALIDATE_TOKEN`, a random string, both as a GitHub secret and as a Vercel
  environment variable. After loading, the workflow calls `POST /api/revalidate`
  with it, so the site drops its cached catalog and shows the new seats on the
  next visit. Without it, the site still catches up within an hour.
- GitHub pauses scheduled workflows after 60 days without commits, and warns by
  email first: push something, or re-enable the workflow in the Actions tab,
  before each window.
