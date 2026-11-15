# gradesync

Collects programs, curricula and class timetables from universities into one
canonical dataset (`gradesync.model.Dataset`), which the web app loads.

Every source goes through two separate steps:

1. **fetch**: download raw pages and PDFs into a snapshot store
   (`.cache/raw/`, with a manifest of URLs, times and hashes). Requests are
   rate-limited per host and honour `Crawl-delay`.
2. **build**: parse the snapshots into a validated dataset. No network access,
   so the same snapshots always produce the same JSON.

Parsers fail loudly when a source changes shape (for example `TemplateChanged`
for the curriculum PDFs) instead of producing wrong data, and the build
cross-checks itself: every program's mandatory rows must add up to the totals
printed in its own curriculum.

## Usage

```bash
python -m venv .venv && .venv/bin/pip install -e '.[dev,db]'

.venv/bin/gradesync fetch ufop --term 2026/2   # ~3 minutes, polite delays
.venv/bin/gradesync build ufop --term 2026/2   # writes out/ufop-2026-2.json
.venv/bin/gradesync discover ufop              # compare the registry with the public catalog

.venv/bin/pytest
.venv/bin/ruff check . && .venv/bin/ruff format --check .
```

## UFOP sources

| Data | Source |
| --- | --- |
| Departments, subjects, syllabi, sections, schedules, instructors, seats | `zeppelin10.ufop.br/HorarioAulas` (JSF form, plain HTTP) |
| Curriculum per program (rows, prerequisites, tracks, required hours) | `zeppelin10.ufop.br/SistemaAcademico/MatrizCurricular?codCurso=<code>` (PDF) |
| Program list (discovery only) | `seja.ufop.br/cursos` |

The program registry lives in `src/gradesync/sources/ufop/programs.py`.

## Adding another institution

Write `gradesync/sources/<code>/adapter.py` with `fetch(store, term, refresh=...)`
and `build(store, term) -> Dataset`, register it in `gradesync/sources/__init__.py`,
and add fixtures and tests for its parsers. Nothing downstream changes.
