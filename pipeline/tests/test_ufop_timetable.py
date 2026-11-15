from datetime import time
from pathlib import Path

import pytest

from gradesync.model import ClassKind, Weekday
from gradesync.sources.ufop.timetable import (
    TimetableParseError,
    parse_department_page,
    parse_departments,
    parse_instructors,
    parse_meetings,
)

FIXTURES = Path(__file__).parent / "fixtures" / "ufop" / "timetable"


def test_departments():
    departments = parse_departments((FIXTURES / "index.html").read_bytes())
    assert len(departments) == 48
    decsi = next(d for d in departments if d.code == "DECSI")
    assert "SISTEMAS" in decsi.name


def test_department_page():
    subjects, sections = parse_department_page((FIXTURES / "DECSI.html").read_bytes(), "DECSI")
    assert (len(subjects), len(sections)) == (66, 83)

    subject = next(s for s in subjects if s.code == "CSI002")
    assert subject.name == "ALGORITMOS I"
    assert subject.syllabus and subject.syllabus.startswith("Arquitetura e funcionamento")

    section = next(s for s in sections if s.subject_code == "CSI002" and s.code == "11")
    assert section.department_code == "DECSI"
    assert [(m.day, m.start, m.end, m.kind) for m in section.meetings] == [
        (Weekday.TUE, time(21, 0), time(22, 40), ClassKind.THEORY),
        (Weekday.THU, time(19, 0), time(20, 40), ClassKind.PRACTICE),
    ]
    assert section.instructors[0].name == "MARLON PAOLO LIMA"
    assert section.instructors[0].kinds == [ClassKind.THEORY, ClassKind.PRACTICE]
    assert (section.delivery, section.location, section.seats, section.enrolled) == (
        "PRESENCIAL",
        "JOAO MONLEVADE",
        1,
        44,
    )


def test_meetings():
    meetings = list(parse_meetings("SEG 07:30-09:10(T) / SAB 8:00-12:00"))
    assert meetings[0].day is Weekday.MON
    assert meetings[1].start == time(8, 0)
    assert meetings[1].kind is None
    assert list(parse_meetings("")) == []


@pytest.mark.parametrize("text", ["XYZ 10:00-11:00(T)", "SEG 10:00", "SEG 11:00-10:00(T)"])
def test_meetings_reject_unexpected_text(text):
    with pytest.raises(ValueError):
        list(parse_meetings(text))


def test_instructors():
    instructors = parse_instructors("ANA SILVA(T) / JOAO SOUZA(T+P), MARIA")
    assert [(i.name, i.kinds) for i in instructors] == [
        ("ANA SILVA", [ClassKind.THEORY]),
        ("JOAO SOUZA", [ClassKind.THEORY, ClassKind.PRACTICE]),
        ("MARIA", []),
    ]


def test_unknown_weekday_is_an_error():
    with pytest.raises(TimetableParseError):
        list(parse_meetings("ABC 10:00-11:00(T)"))
