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
| `apps/web/` | The Next.js app. |

## Local setup

```bash
docker compose up -d --wait             # Postgres on localhost:54329
npm install                             # workspace packages
cp packages/db/.env.example packages/db/.env
npm run migrate:dev -w @grade/db        # create the tables

cd pipeline
python -m venv .venv && .venv/bin/pip install -e '.[dev,db]'
.venv/bin/gradesync fetch ufop --term 2026/2
.venv/bin/gradesync build ufop --term 2026/2
DATABASE_URL=postgresql://grade:grade@localhost:54329/grade \
  .venv/bin/gradesync load out/ufop-2026-2.json --current
```
