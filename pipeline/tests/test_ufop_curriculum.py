from pathlib import Path

import pytest

from gradesync.model import EntryCategory, HoursRequirement, SubjectRequirement
from gradesync.sources.ufop import curriculum
from gradesync.sources.ufop.curriculum import (
    CurriculumParseError,
    TemplateChanged,
    parse_curriculum_pdf,
    parse_requirements,
)

FIXTURES = Path(__file__).parent / "fixtures" / "ufop" / "curricula"


def parse(code: str):
    return parse_curriculum_pdf((FIXTURES / f"{code}.pdf").read_bytes(), code)


def entry(program, code: str):
    return next(e for e in program.entries if e.subject_code == code)


def codes(requirements) -> list[str]:
    return [r.code if r.type == "subject" else f"{r.hours}h" for r in requirements]


def test_header_and_totals():
    result = parse("SJM")
    program = result.program
    assert result.term == "2026/2"
    assert (program.name, program.degree, program.curriculum_version, program.campus) == (
        "SISTEMAS DE INFORMAÇÃO",
        "BACHARELADO",
        "3",
        "JOAO MONLEVADE",
    )
    assert program.required_hours["total"] == 3000
    # The mandatory rows add up to the PDF's own total, so nothing is missing.
    assert result.warnings == []


def test_mandatory_row():
    program = parse("COM").program
    row = entry(program, "BCC113")
    assert row.name == "INTRODUCAO AO APRENDIZADO DE MAQUINA"
    assert row.category is EntryCategory.MANDATORY
    assert (row.period, row.workload_hours, row.extension_hours, row.class_hours) == (5, 60, 0, 72)
    assert (row.weekly_theory, row.weekly_practice) == (4, 0)
    assert codes(row.requirements) == ["BCC137", "EST202", "MTM123"]


def test_wrapped_prerequisites_in_electives():
    # Hours and codes on separate lines, plus a name that wraps between them.
    row = entry(parse("COM").program, "BCC403")
    assert row.name == "INTERFACE DE USUARIO AVANCADA PARA WEARABLE COMPUTING"
    assert row.category is EntryCategory.ELECTIVE
    assert row.period is None
    assert codes(row.requirements) == ["720h", "BCC138", "BCC324", "BCC327"]


def test_name_touching_the_prerequisite_column():
    # "COMPUTACIONAIS" ends 1.4pt before "720 horas"; they must not merge.
    row = entry(parse("COM").program, "BCC407")
    assert row.name == "PROJETO E ANALISE DE EXPERIMENTOS COMPUTACIONAIS"
    assert codes(row.requirements) == ["720h"]


def test_hours_and_subject_requirement_together():
    row = entry(parse("SJM").program, "CSI992")
    assert codes(row.requirements) == ["1800h", "CSI902"]


def test_activities():
    program = parse("SJM").program
    activities = [e for e in program.entries if e.category is EntryCategory.ACTIVITY]
    assert activities, "the activities table must be parsed (it has no T/P sub-header)"
    assert all(a.workload_hours for a in activities)


def test_activity_codes_without_digits():
    program = parse("FAR").program
    assert {"ATC", "ATE"} <= {e.subject_code for e in program.entries}


def test_null_cells_are_empty():
    row = entry(parse("D06").program, "EAD614")
    assert row.category is EntryCategory.OPTIONAL
    assert row.workload_hours == 30


def test_tracks_from_table_labels():
    result = parse("CBB")
    program = result.program
    assert {t.name for t in program.tracks} == {"BIODIVERSIDADE E MEIO AMBIENTE", "BIOTECNOLOGIA"}
    assert entry(program, "CBI063").track == "BIOTECNOLOGIA"
    # Track totals = common rows + the track's own rows; all of them agree.
    assert result.warnings == []


def test_habilitacao_and_enfase_with_same_names():
    result = parse("FSB")
    kinds = {(t.kind, t.name) for t in result.program.tracks}
    assert kinds == {
        ("habilitação", "CIENCIA DOS MATERIAIS"),
        ("habilitação", "FISICA BASICA"),
        ("ênfase", "CIENCIA DOS MATERIAIS"),
        ("ênfase", "FISICA BASICA"),
    }
    assert entry(result.program, "QUI244").track == "CIENCIA DOS MATERIAIS"
    assert entry(result.program, "FIS822").track is None
    assert result.warnings == []


def test_template_change_is_detected(monkeypatch):
    layout = curriculum.LAYOUTS["DISCIPLINAS OBRIGATÓRIAS"]
    moved = curriculum.TableLayout(layout.category, layout.columns, {**layout.anchors, "CHA": 300})
    monkeypatch.setitem(curriculum.LAYOUTS, "DISCIPLINAS OBRIGATÓRIAS", moved)
    with pytest.raises(TemplateChanged):
        parse("SJM")


@pytest.mark.parametrize(
    ("text", "bare_hours", "expected"),
    [
        ("", False, []),
        ("CSI101", False, [SubjectRequirement(code="CSI101")]),
        (
            "720 horas BCC139",
            False,
            [HoursRequirement(hours=720), SubjectRequirement(code="BCC139")],
        ),
        ("1200", True, [HoursRequirement(hours=1200)]),
        ("0 horas", False, []),
        ("CSI101 CSI101", False, [SubjectRequirement(code="CSI101")]),
    ],
)
def test_parse_requirements(text, bare_hours, expected):
    assert parse_requirements(text, bare_hours=bare_hours) == expected


@pytest.mark.parametrize("text", ["1200", "CSI10", "ou CSI101"])
def test_parse_requirements_rejects_unknown_text(text):
    with pytest.raises(CurriculumParseError):
        parse_requirements(text)
