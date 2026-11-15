"""Load a Dataset into Postgres (tables defined by packages/db's Prisma migrations).

One transaction per dataset:

* Long-lived rows (institution, term, departments, subjects, programs,
  curricula, sections) are upserted by their natural keys, so their ids stay
  stable and student data that points at them keeps working across syncs.
* Rows that only describe a parent (curriculum tracks, entries, requirements,
  section meetings and instructors) are replaced wholesale.
* Sections missing from the dataset are marked ``withdrawn_at`` instead of being
  deleted, so saved schedules can say "this class is no longer offered".

Loading the same dataset twice is a no-op (the term stores the dataset hash).
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from datetime import time

import psycopg
from psycopg.types.json import Jsonb

from gradesync.model import Dataset


class LoadError(RuntimeError):
    pass


@dataclass(frozen=True)
class LoadStats:
    skipped: bool
    subjects: int = 0
    programs: int = 0
    entries: int = 0
    sections: int = 0
    withdrawn: int = 0


def current_term(conn: psycopg.Connection, institution: str) -> str | None:
    """Code of the term the site shows for ``institution``, if any."""
    row = conn.execute(
        """
        SELECT t.code FROM term t JOIN institution i ON i.id = t.institution_id
        WHERE i.code = %s AND t.is_current
        """,
        (institution,),
    ).fetchone()
    return row[0] if row else None


def dataset_sha256(dataset: Dataset) -> str:
    return hashlib.sha256(dataset.model_dump_json().encode()).hexdigest()


def load_dataset(
    conn: psycopg.Connection,
    dataset: Dataset,
    *,
    make_current: bool = False,
    force: bool = False,
) -> LoadStats:
    digest = dataset_sha256(dataset)
    with conn.transaction(), conn.cursor() as cur:
        # Serialise loads of the same institution.
        cur.execute(
            "SELECT pg_advisory_xact_lock(hashtext(%s))", (f"gradesync:{dataset.institution.code}",)
        )

        institution_id = _one(
            cur,
            """
            INSERT INTO institution (code, name, timezone) VALUES (%s, %s, %s)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, timezone = EXCLUDED.timezone
            RETURNING id
            """,
            (dataset.institution.code, dataset.institution.name, dataset.institution.timezone),
        )
        term_id, previous_digest = _one_row(
            cur,
            """
            INSERT INTO term (institution_id, code) VALUES (%s, %s)
            ON CONFLICT (institution_id, code) DO UPDATE SET code = EXCLUDED.code
            RETURNING id, dataset_sha256
            """,
            (institution_id, dataset.term),
        )
        if make_current:
            cur.execute(
                "UPDATE term SET is_current = (id = %s) WHERE institution_id = %s",
                (term_id, institution_id),
            )
        if previous_digest == digest and not force:
            return LoadStats(skipped=True)

        departments = _upsert_departments(cur, institution_id, dataset)
        subjects = _upsert_subjects(cur, institution_id, dataset, departments)
        entries = _load_curricula(cur, institution_id, term_id, dataset, subjects)
        sections, withdrawn = _load_sections(cur, term_id, dataset, subjects, departments)

        cur.execute(
            "UPDATE term SET synced_at = %s, dataset_sha256 = %s WHERE id = %s",
            (dataset.generated_at, digest, term_id),
        )
    return LoadStats(
        skipped=False,
        subjects=len(dataset.subjects),
        programs=len(dataset.programs),
        entries=entries,
        sections=sections,
        withdrawn=withdrawn,
    )


def _upsert_departments(
    cur: psycopg.Cursor, institution_id: str, dataset: Dataset
) -> dict[str, str]:
    cur.executemany(
        """
        INSERT INTO department (institution_id, code, name, display_name) VALUES (%s, %s, %s, %s)
        ON CONFLICT (institution_id, code) DO UPDATE SET
          name = EXCLUDED.name, display_name = EXCLUDED.display_name
        """,
        [(institution_id, d.code, d.name, d.display_name) for d in dataset.departments],
    )
    return _ids(cur, "department", institution_id)


def _upsert_subjects(
    cur: psycopg.Cursor, institution_id: str, dataset: Dataset, departments: dict[str, str]
) -> dict[str, str]:
    rows = []
    for s in dataset.subjects:
        if s.department_code and s.department_code not in departments:
            raise LoadError(f"subject {s.code}: unknown department {s.department_code}")
        department_id = departments.get(s.department_code or "")
        rows.append((institution_id, s.code, s.name, s.display_name, department_id, s.syllabus))
    cur.executemany(
        """
        INSERT INTO subject (institution_id, code, name, display_name, department_id, syllabus)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (institution_id, code) DO UPDATE SET
          name = EXCLUDED.name,
          display_name = EXCLUDED.display_name,
          department_id = COALESCE(EXCLUDED.department_id, subject.department_id),
          syllabus = COALESCE(EXCLUDED.syllabus, subject.syllabus),
          updated_at = now()
        """,
        rows,
    )
    return _ids(cur, "subject", institution_id)


def _load_curricula(
    cur: psycopg.Cursor,
    institution_id: str,
    term_id: str,
    dataset: Dataset,
    subjects: dict[str, str],
) -> int:
    cur.executemany(
        """
        INSERT INTO program (institution_id, code, name, display_name, degree, campus)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (institution_id, code) DO UPDATE SET
          name = EXCLUDED.name, display_name = EXCLUDED.display_name,
          degree = EXCLUDED.degree, campus = EXCLUDED.campus
        """,
        [
            (institution_id, p.code, p.name, p.display_name, p.degree, p.campus)
            for p in dataset.programs
        ],
    )
    programs = _ids(cur, "program", institution_id)

    curricula: dict[str, str] = {}
    for program in dataset.programs:
        curricula[program.code] = _one(
            cur,
            """
            INSERT INTO curriculum (program_id, term_id, version, required_hours, source_url)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (program_id, term_id) DO UPDATE SET
              version = EXCLUDED.version,
              required_hours = EXCLUDED.required_hours,
              source_url = EXCLUDED.source_url
            RETURNING id
            """,
            (
                programs[program.code],
                term_id,
                program.curriculum_version,
                Jsonb(program.required_hours),
                program.source_url,
            ),
        )
    ids = list(curricula.values())
    cur.execute("DELETE FROM curriculum_track WHERE curriculum_id = ANY(%s)", (ids,))
    cur.execute("DELETE FROM curriculum_entry WHERE curriculum_id = ANY(%s)", (ids,))

    tracks, entries, requirements = [], [], []
    for program in dataset.programs:
        curriculum_id = curricula[program.code]
        for track in program.tracks:
            tracks.append((curriculum_id, track.kind, track.name, Jsonb(track.required_hours)))
        for entry in program.entries:
            entry_id = str(uuid.uuid4())
            entries.append(
                (
                    entry_id,
                    curriculum_id,
                    _subject_id(subjects, entry.subject_code, program.code),
                    entry.category.value,
                    entry.track,
                    entry.period,
                    entry.workload_hours,
                    entry.extension_hours,
                    entry.class_hours,
                    entry.weekly_theory,
                    entry.weekly_practice,
                )
            )
            for requirement in entry.requirements:
                if requirement.type == "subject":
                    subject_id = _subject_id(subjects, requirement.code, program.code)
                    requirements.append((entry_id, subject_id, None))
                else:
                    requirements.append((entry_id, None, requirement.hours))

    _copy(cur, "curriculum_track", ("curriculum_id", "kind", "name", "required_hours"), tracks)
    _copy(
        cur,
        "curriculum_entry",
        (
            "id",
            "curriculum_id",
            "subject_id",
            "category",
            "track",
            "period",
            "workload_hours",
            "extension_hours",
            "class_hours",
            "weekly_theory",
            "weekly_practice",
        ),
        entries,
    )
    _copy(cur, "entry_requirement", ("entry_id", "subject_id", "hours"), requirements)
    return len(entries)


def _load_sections(
    cur: psycopg.Cursor,
    term_id: str,
    dataset: Dataset,
    subjects: dict[str, str],
    departments: dict[str, str],
) -> tuple[int, int]:
    rows = [
        (
            term_id,
            _subject_id(subjects, s.subject_code, s.department_code),
            departments[s.department_code],
            s.code,
            s.delivery,
            s.modality,
            s.location,
            s.language,
            s.seats,
            s.enrolled,
            s.reservation,
        )
        for s in dataset.sections
    ]
    cur.executemany(
        """
        INSERT INTO section (term_id, subject_id, department_id, code, delivery, modality,
                             location, language, seats, enrolled, reservation)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (term_id, subject_id, code) DO UPDATE SET
          department_id = EXCLUDED.department_id,
          delivery = EXCLUDED.delivery,
          modality = EXCLUDED.modality,
          location = EXCLUDED.location,
          language = EXCLUDED.language,
          seats = EXCLUDED.seats,
          enrolled = EXCLUDED.enrolled,
          reservation = EXCLUDED.reservation,
          withdrawn_at = NULL,
          updated_at = now()
        """,
        rows,
    )
    cur.execute(
        """
        SELECT s.id, sub.code, s.code FROM section s JOIN subject sub ON sub.id = s.subject_id
        WHERE s.term_id = %s
        """,
        (term_id,),
    )
    section_ids = {(subject_code, code): id_ for id_, subject_code, code in cur.fetchall()}
    current = [section_ids[(s.subject_code, s.code)] for s in dataset.sections]

    cur.execute(
        """
        UPDATE section SET withdrawn_at = now()
        WHERE term_id = %s AND withdrawn_at IS NULL AND NOT (id = ANY(%s))
        """,
        (term_id, current),
    )
    withdrawn = cur.rowcount

    cur.execute("DELETE FROM section_meeting WHERE section_id = ANY(%s)", (current,))
    cur.execute("DELETE FROM section_instructor WHERE section_id = ANY(%s)", (current,))
    meetings, instructors = [], []
    for section in dataset.sections:
        section_id = section_ids[(section.subject_code, section.code)]
        for m in section.meetings:
            kind = m.kind.value if m.kind else None
            meetings.append((section_id, m.day.value, _minutes(m.start), _minutes(m.end), kind))
        for position, instructor in enumerate(section.instructors):
            kinds = "{" + ",".join(k.value for k in instructor.kinds) + "}"
            instructors.append((section_id, position, instructor.name, kinds))
    _copy(
        cur,
        "section_meeting",
        ("section_id", "day", "start_minute", "end_minute", "kind"),
        meetings,
    )
    _copy(cur, "section_instructor", ("section_id", "position", "name", "kinds"), instructors)
    return len(current), withdrawn


# --- Helpers ----------------------------------------------------------------


def _one(cur: psycopg.Cursor, sql: str, params: tuple) -> str:
    return _one_row(cur, sql, params)[0]


def _one_row(cur: psycopg.Cursor, sql: str, params: tuple) -> tuple:
    cur.execute(sql, params)
    row = cur.fetchone()
    if row is None:
        raise LoadError(f"query returned no row: {sql.split()[0:3]}")
    return tuple(str(v) if isinstance(v, uuid.UUID) else v for v in row)


def _ids(cur: psycopg.Cursor, table: str, institution_id: str) -> dict[str, str]:
    cur.execute(f"SELECT code, id FROM {table} WHERE institution_id = %s", (institution_id,))
    return {code: str(id_) for code, id_ in cur.fetchall()}


def _subject_id(subjects: dict[str, str], code: str, context: str) -> str:
    try:
        return subjects[code]
    except KeyError:
        raise LoadError(f"{context}: subject {code} is not in the dataset") from None


def _copy(cur: psycopg.Cursor, table: str, columns: tuple[str, ...], rows: list[tuple]) -> None:
    if not rows:
        return
    with cur.copy(f"COPY {table} ({', '.join(columns)}) FROM STDIN") as copy:
        for row in rows:
            copy.write_row(row)


def _minutes(value: time) -> int:
    return value.hour * 60 + value.minute
