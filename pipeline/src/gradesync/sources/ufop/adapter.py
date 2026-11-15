"""UFOP adapter: fetch every source into the raw store, then build a Dataset.

Sources:

* Timetable (all departments): ``zeppelin10.ufop.br/HorarioAulas``
* Curricula (one PDF per program): ``zeppelin10.ufop.br/SistemaAcademico/MatrizCurricular``
* Program catalog (discovery only): ``seja.ufop.br/cursos``
"""

from __future__ import annotations

import re
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from datetime import UTC, datetime

from gradesync.model import (
    Dataset,
    Department,
    EntryCategory,
    Institution,
    Program,
    Section,
    SourceRef,
    Subject,
)
from gradesync.net import Fetcher, RawStore
from gradesync.sources.ufop import timetable
from gradesync.sources.ufop.curriculum import (
    CurriculumParseError,
    ParsedCurriculum,
    parse_curriculum_pdf,
)
from gradesync.sources.ufop.programs import PENDING_SLUGS, PROGRAMS
from gradesync.text import build_lexicon, display_name

INSTITUTION = Institution(
    code="ufop", name="Universidade Federal de Ouro Preto", timezone="America/Sao_Paulo"
)
CURRICULUM_URL = "https://zeppelin10.ufop.br/SistemaAcademico/MatrizCurricular?codCurso={code}"
CATALOG_URL = "https://seja.ufop.br/cursos"

# seja.ufop.br asks for Crawl-delay: 10 in robots.txt; zeppelin10 has no robots.txt.
DELAYS = {"seja.ufop.br": 10.0, "zeppelin10.ufop.br": 1.5}


def curriculum_key(code: str) -> str:
    return f"ufop/curricula/{code}.pdf"


# --- Fetch ------------------------------------------------------------------


def fetch(store: RawStore, term: str, *, refresh: bool = False) -> list[str]:
    """Fetch the timetable for ``term`` and every registered curriculum."""
    keys: list[str] = []
    with Fetcher(delays=DELAYS) as fetcher:
        if refresh or not store.has(f"{timetable.snapshot_prefix(term)}index.html"):
            keys += timetable.fetch_timetable(fetcher, store, term)
        for ref in PROGRAMS:
            key = curriculum_key(ref.code)
            if store.has(key) and not refresh:
                continue
            url = CURRICULUM_URL.format(code=ref.code)
            response = fetcher.get(url)
            # Unknown codes still answer 200, with an empty body and no attachment.
            if "application/pdf" not in response.headers.get("content-type", ""):
                raise RuntimeError(f"{ref.code}: the academic system returned no curriculum")
            keys.append(store.put(key, url, response.content).key)
    return keys


@dataclass
class Discovery:
    unregistered: dict[str, list[str]] = field(default_factory=dict)  # slug -> codes
    missing: list[str] = field(default_factory=list)  # registered codes not linked anywhere
    unknown_slugs: list[str] = field(default_factory=list)  # catalog pages with no code


def discover(store: RawStore) -> Discovery:
    """Crawl the public catalog and compare it with the program registry."""
    with Fetcher(delays=DELAYS) as fetcher:
        listing = fetcher.get(CATALOG_URL).text
        store.put("ufop/catalog/index.html", CATALOG_URL, listing.encode())
        slugs = sorted(set(re.findall(r'href="/cursos/([a-z0-9-]+)"', listing)))
        linked: dict[str, list[str]] = {}
        for slug in slugs:
            page = fetcher.get(f"{CATALOG_URL}/{slug}").text
            store.put(f"ufop/catalog/{slug}.html", f"{CATALOG_URL}/{slug}", page.encode())
            linked[slug] = sorted(set(re.findall(r"MatrizCurricular\?codCurso=(\w+)", page)))

    registered = {ref.code for ref in PROGRAMS}
    result = Discovery()
    for slug, codes in linked.items():
        new = [c for c in codes if c not in registered]
        if new:
            result.unregistered[slug] = new
        if (
            not codes
            and slug not in PENDING_SLUGS
            and not any(ref.catalog_slug == slug for ref in PROGRAMS)
        ):
            result.unknown_slugs.append(slug)
    all_linked = {c for codes in linked.values() for c in codes}
    result.missing = sorted(
        ref.code for ref in PROGRAMS if ref.code not in all_linked and ref.found_via is None
    )
    return result


# --- Build ------------------------------------------------------------------


def build(store: RawStore, term: str) -> Dataset:
    """Build the dataset for ``term`` from snapshots only (no network)."""
    warnings: list[str] = []
    prefix = timetable.snapshot_prefix(term)
    sources = [store.get(f"{prefix}index.html")]

    departments = timetable.parse_departments(sources[0].content)
    subjects: dict[str, Subject] = {}
    sections: list[Section] = []
    for department in departments:
        snapshot = store.get(f"{prefix}{department.code}.html")
        sources.append(snapshot)
        page_subjects, page_sections = timetable.parse_department_page(
            snapshot.content, department.code
        )
        for subject in page_subjects:
            subjects.setdefault(subject.code, subject)
        sections.extend(page_sections)

    programs: list[Program] = []
    snapshots = [store.get(curriculum_key(ref.code)) for ref in PROGRAMS]
    sources.extend(snapshots)
    # PDF layout analysis is CPU-bound; parse the curricula in parallel.
    with ProcessPoolExecutor() as pool:
        results = pool.map(
            _parse_curriculum,
            [s.content for s in snapshots],
            [ref.code for ref in PROGRAMS],
            [s.url for s in snapshots],
        )
        for ref, result in zip(PROGRAMS, results, strict=True):
            if isinstance(result, str):
                warnings.append(f"curriculum {ref.code} skipped: {result}")
                continue
            if result.term != term:
                warnings.append(f"curriculum {ref.code} is for {result.term}, not {term}")
            warnings.extend(result.warnings)
            programs.append(result.program)

    _add_curriculum_only_subjects(subjects, programs, departments, warnings)
    warnings.extend(_check_references(subjects, programs))
    departments, subjects, programs = _add_display_names(departments, subjects, programs)

    return Dataset(
        institution=INSTITUTION,
        term=term,
        generated_at=max(s.fetched_at for s in sources) if sources else datetime.now(UTC),
        departments=sorted(departments, key=lambda d: d.code),
        subjects=sorted(subjects, key=lambda s: s.code),
        programs=sorted(programs, key=lambda p: p.code),
        sections=sorted(sections, key=lambda s: (s.subject_code, s.code)),
        sources=[
            SourceRef(key=s.key, url=s.url, fetched_at=s.fetched_at, sha256=s.sha256)
            for s in sorted(sources, key=lambda s: s.key)
        ],
        warnings=warnings,
    )


def _add_display_names(
    departments: list[Department], subjects: dict[str, Subject], programs: list[Program]
) -> tuple[list[Department], list[Subject], list[Program]]:
    """Readable names, spelled the way the syllabi and program titles spell words."""
    lexicon = build_lexicon(
        [s.syllabus for s in subjects.values() if s.syllabus] + [p.name for p in programs]
    )
    return (
        [d.model_copy(update={"display_name": display_name(d.name, lexicon)}) for d in departments],
        [
            s.model_copy(update={"display_name": display_name(s.name, lexicon)})
            for s in subjects.values()
        ],
        [p.model_copy(update={"display_name": display_name(p.name, lexicon)}) for p in programs],
    )


def _parse_curriculum(content: bytes, code: str, url: str) -> ParsedCurriculum | str:
    """Worker for the process pool: the parsed curriculum, or the error message."""
    try:
        return parse_curriculum_pdf(content, code, url)
    except CurriculumParseError as error:
        return str(error)


def _add_curriculum_only_subjects(
    subjects: dict[str, Subject],
    programs: list[Program],
    departments: list[Department],
    warnings: list[str],
) -> None:
    """Subjects not offered this term only appear in curricula; add them too.

    Their department is inferred from the code prefix when every offered
    subject with that prefix belongs to one department.
    """
    prefix_departments: dict[str, Counter[str]] = {}
    for subject in subjects.values():
        if subject.department_code:
            prefix_departments.setdefault(subject.code[:3], Counter())[subject.department_code] += 1
    known_departments = {d.code for d in departments}

    for program in programs:
        for entry in program.entries:
            if entry.subject_code in subjects:
                continue
            owners = prefix_departments.get(entry.subject_code[:3], Counter())
            department = next(iter(owners)) if len(owners) == 1 else None
            if department is None and f"DE{entry.subject_code[:3]}" in known_departments:
                department = f"DE{entry.subject_code[:3]}"
            subjects[entry.subject_code] = Subject(
                code=entry.subject_code, name=entry.name, department_code=department
            )
    # Activities (complementary hours, internships...) belong to programs, not departments.
    activities = {
        e.subject_code for p in programs for e in p.entries if e.category is EntryCategory.ACTIVITY
    }
    unassigned = sorted(
        s.code for s in subjects.values() if s.department_code is None and s.code not in activities
    )
    if unassigned:
        warnings.append(f"{len(unassigned)} subjects without a known department: {unassigned[:20]}")


def _check_references(subjects: dict[str, Subject], programs: list[Program]) -> list[str]:
    """Report prerequisites that point to subjects no source knows about."""
    missing: Counter[str] = Counter()
    for program in programs:
        for entry in program.entries:
            for requirement in entry.requirements:
                if requirement.type == "subject" and requirement.code not in subjects:
                    missing[requirement.code] += 1
    if not missing:
        return []
    return [f"{len(missing)} prerequisite codes match no subject: {sorted(missing)[:20]}"]
