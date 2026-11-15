"""Loader tests against a real Postgres built from packages/db's migrations.

Set DATABASE_URL to any database on the server (e.g. the docker-compose one);
the tests create and drop their own ``gradesync_test`` database.
"""

import os
from datetime import UTC, datetime, time
from pathlib import Path

import pytest

from gradesync.model import (
    ClassKind,
    CurriculumEntry,
    Dataset,
    Department,
    EntryCategory,
    HoursRequirement,
    Institution,
    Instructor,
    Meeting,
    Program,
    Section,
    Subject,
    SubjectRequirement,
    Track,
    Weekday,
)

psycopg = pytest.importorskip("psycopg")

MIGRATIONS = Path(__file__).parents[2] / "packages" / "db" / "prisma" / "migrations"
TEST_DB = "gradesync_test"


@pytest.fixture
def conn():
    url = os.environ.get("DATABASE_URL")
    if not url:
        pytest.skip("DATABASE_URL not set")
    with psycopg.connect(url, autocommit=True) as admin:
        admin.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        admin.execute(f"CREATE DATABASE {TEST_DB}")
    test_url = psycopg.conninfo.make_conninfo(url, dbname=TEST_DB)
    with psycopg.connect(test_url) as connection:
        for migration in sorted(MIGRATIONS.glob("*/migration.sql")):
            connection.execute(migration.read_text())
        connection.commit()
        yield connection
    with psycopg.connect(url, autocommit=True) as admin:
        admin.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")


def make_dataset(**changes) -> Dataset:
    sections = [
        Section(
            subject_code="AAA101",
            code="11",
            department_code="DEAAA",
            meetings=[
                Meeting(day=Weekday.MON, start=time(7, 30), end=time(9, 10), kind=ClassKind.THEORY)
            ],
            instructors=[Instructor(name="ANA", kinds=[ClassKind.THEORY])],
            seats=40,
            enrolled=10,
        ),
        Section(
            subject_code="AAA102",
            code="21",
            department_code="DEAAA",
            meetings=[Meeting(day=Weekday.TUE, start=time(19, 0), end=time(20, 40))],
        ),
    ]
    values = {
        "institution": Institution(code="test", name="Test University", timezone="UTC"),
        "term": "2026/2",
        "generated_at": datetime(2026, 11, 14, tzinfo=UTC),
        "departments": [Department(code="DEAAA", name="Dept A")],
        "subjects": [
            Subject(code="AAA101", name="Intro", department_code="DEAAA", syllabus="Basics."),
            Subject(code="AAA102", name="Next", department_code="DEAAA"),
            Subject(code="AAA900", name="Thesis"),
        ],
        "programs": [
            Program(
                code="P1",
                name="Program One",
                entries=[
                    CurriculumEntry(
                        subject_code="AAA101",
                        name="INTRO",
                        category=EntryCategory.MANDATORY,
                        period=1,
                        workload_hours=60,
                    ),
                    CurriculumEntry(
                        subject_code="AAA102",
                        name="NEXT",
                        category=EntryCategory.MANDATORY,
                        period=2,
                        requirements=[SubjectRequirement(code="AAA101")],
                    ),
                    CurriculumEntry(
                        subject_code="AAA900",
                        name="THESIS",
                        category=EntryCategory.ELECTIVE,
                        track="DATA",
                        requirements=[
                            HoursRequirement(hours=1800),
                            SubjectRequirement(code="AAA102"),
                        ],
                    ),
                ],
                required_hours={"mandatory": 60, "total": 100},
                tracks=[Track(name="DATA", kind="ênfase", required_hours={"mandatory": 60})],
            )
        ],
        "sections": sections,
        "sources": [],
    }
    values.update(changes)
    return Dataset(**values)


def count(conn, table: str) -> int:
    return conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]


def section_ids(conn) -> dict[str, str]:
    rows = conn.execute(
        "SELECT sub.code || '-' || s.code, s.id::text "
        "FROM section s JOIN subject sub ON sub.id = s.subject_id"
    ).fetchall()
    return dict(rows)


def test_load_writes_every_table(conn):
    from gradesync.load import load_dataset

    stats = load_dataset(conn, make_dataset(), make_current=True)
    assert not stats.skipped
    assert (count(conn, "subject"), count(conn, "curriculum_entry")) == (3, 3)
    assert count(conn, "entry_requirement") == 3
    assert (
        count(conn, "section"),
        count(conn, "section_meeting"),
        count(conn, "section_instructor"),
    ) == (2, 2, 1)
    assert count(conn, "curriculum_track") == 1

    minutes = conn.execute(
        "SELECT start_minute, end_minute, day::text FROM section_meeting ORDER BY day"
    ).fetchall()
    assert minutes[0] == (450, 550, "MON")
    hours = conn.execute("SELECT hours FROM entry_requirement WHERE hours IS NOT NULL").fetchall()
    assert hours == [(1800,)]
    assert conn.execute("SELECT is_current, dataset_sha256 IS NOT NULL FROM term").fetchone() == (
        True,
        True,
    )


def test_current_term(conn):
    from gradesync.load import current_term, load_dataset

    assert current_term(conn, "test") is None
    load_dataset(conn, make_dataset())
    assert current_term(conn, "test") is None
    load_dataset(conn, make_dataset(), make_current=True)
    assert current_term(conn, "test") == make_dataset().term


def test_same_dataset_twice_is_a_no_op(conn):
    from gradesync.load import load_dataset

    load_dataset(conn, make_dataset())
    assert load_dataset(conn, make_dataset()).skipped


def test_resync_keeps_ids_and_withdraws_missing_sections(conn):
    from gradesync.load import load_dataset

    first = make_dataset()
    load_dataset(conn, first)
    before = section_ids(conn)
    subject_before = conn.execute("SELECT id FROM subject WHERE code = 'AAA101'").fetchone()

    changed = first.sections[0].model_copy(update={"enrolled": 35})
    load_dataset(conn, make_dataset(sections=[changed]))

    assert section_ids(conn) == before
    assert conn.execute("SELECT id FROM subject WHERE code = 'AAA101'").fetchone() == subject_before
    withdrawn = conn.execute(
        "SELECT sub.code, s.withdrawn_at IS NOT NULL, s.enrolled FROM section s "
        "JOIN subject sub ON sub.id = s.subject_id ORDER BY sub.code"
    ).fetchall()
    assert withdrawn == [("AAA101", False, 35), ("AAA102", True, None)]
    # Meetings of withdrawn sections stay, so saved schedules can still show them.
    assert count(conn, "section_meeting") == 2


def test_withdrawn_section_comes_back(conn):
    from gradesync.load import load_dataset

    full = make_dataset()
    load_dataset(conn, full)
    load_dataset(conn, make_dataset(sections=full.sections[:1]))
    load_dataset(conn, full)
    assert conn.execute(
        "SELECT count(*) FROM section WHERE withdrawn_at IS NOT NULL"
    ).fetchone() == (0,)


def test_unknown_subject_fails_without_writing(conn):
    from gradesync.load import LoadError, load_dataset

    broken = make_dataset(
        sections=[Section(subject_code="ZZZ999", code="1", department_code="DEAAA")]
    )
    with pytest.raises(LoadError):
        load_dataset(conn, broken)
    conn.rollback()
    assert count(conn, "institution") == 0
