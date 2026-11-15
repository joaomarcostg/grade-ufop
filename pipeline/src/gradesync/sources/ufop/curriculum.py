"""Parser for UFOP curriculum PDFs ("matriz curricular").

The PDFs come from ``SistemaAcademico/MatrizCurricular?codCurso=<code>`` and are
all rendered by one JasperReports template, so each table column sits at a
fixed x range. Two properties of the template shape the parser:

* Text is not clipped to its cell: a long name can run a few points into the
  prerequisite column, and neighbouring cells are often glued together in the
  raw text. Every word still *starts* inside its own cell, so the parser builds
  words from characters and assigns each word by its starting x.
* Programs with specialisations (habilitação/ênfase) put a centred label line
  inside the tables; rows after it belong to that track.

Header positions are checked first, so a template change stops parsing with
:class:`TemplateChanged` instead of silently producing wrong data.
"""

from __future__ import annotations

import io
import re
from collections.abc import Iterable
from dataclasses import dataclass, field

import pdfplumber
from pdfplumber.page import Page

from gradesync.model import (
    CurriculumEntry,
    EntryCategory,
    HoursRequirement,
    Program,
    Requirement,
    SubjectRequirement,
    Track,
)

CODE_RE = re.compile(r"^[A-Z]{3}\d{3}$")
# Activities may use bare letter codes (Farmácia: "ATC", "ATE").
ACTIVITY_CODE_RE = re.compile(r"^[A-Z]{3}(?:\d{3})?$")
TITLE_RE = re.compile(
    r"^CURSO DE (?P<name>.+) \((?P<degree>[^()]+)\) - (?P<term>\d{4}/\d)\s*"
    r"\(currículo\s*(?P<version>\w+)\)$"
)
SUMMARY_TITLE_RE = re.compile(
    r"Integralização\s+(?:no\s+Curso|na\s+(?P<kind>Habilitação|Ênfase)\s+(?P<name>.+))$"
)
SUMMARY_LABELS = {
    "Disciplinas Obrigatórias": "mandatory",
    "Disciplinas Eletivas": "elective",
    "Disciplinas Optativas": "optional",
    "Disciplinas Facultativas": "facultative",
    "Atividades": "activities",
    "Extensão": "extension",
    "Total": "total",
}
SUMMARY_START = "Componentes Curriculares"
LEGEND_START = "CHS - Carga Horária"

# How far above its code a row starts (prerequisites sit ~3pt lower than the
# code, and rows are at least ~11pt apart).
ROW_LEAD = 5.0
HEADER_TOLERANCE = 8.0
# Characters closer than this belong to the same word.
WORD_GAP = 0.8
# Track labels are centred in the table; continuation lines of a name start at
# x~73 and wrapped prerequisites at x=310.
TRACK_LABEL_X = (120.0, 305.0)
# Side-by-side summary blocks: the right one starts at x~297.
SUMMARY_SPLIT_X = 290.0
# The report prints missing numbers as an empty cell or the literal "null".
NULLS = {"", "null"}


class CurriculumParseError(ValueError):
    pass


class TemplateChanged(CurriculumParseError):
    pass


@dataclass(frozen=True)
class Column:
    name: str
    x0: float
    x1: float


@dataclass(frozen=True)
class TableLayout:
    category: EntryCategory | None  # None: activities table
    columns: tuple[Column, ...]
    anchors: dict[str, float]  # header word -> expected x0
    code_re: re.Pattern[str] = CODE_RE


_SUBJECT_COLUMNS = (
    Column("code", 0, 70),
    Column("name", 70, 309.5),
    Column("requirements", 309.5, 432),
    Column("workload", 432, 476),
    Column("class_hours", 476, 508),
    Column("theory", 508, 530),
    Column("practice", 530, 550),
    Column("period", 550, 600),
)
_SUBJECT_ANCHORS = {"PRÉ-REQUISITO": 336, "CHS/CHE": 430, "CHA": 479, "AULAS": 513, "PER": 553}

LAYOUTS = {
    "DISCIPLINAS OBRIGATÓRIAS": TableLayout(
        EntryCategory.MANDATORY, _SUBJECT_COLUMNS, _SUBJECT_ANCHORS
    ),
    "DISCIPLINAS ELETIVAS": TableLayout(EntryCategory.ELECTIVE, _SUBJECT_COLUMNS, _SUBJECT_ANCHORS),
    "DISCIPLINAS OPTATIVAS": TableLayout(
        EntryCategory.OPTIONAL, _SUBJECT_COLUMNS, _SUBJECT_ANCHORS
    ),
    "ATIVIDADES": TableLayout(
        None,
        (
            Column("code", 0, 70),
            Column("name", 70, 340),
            Column("requirements", 340, 440),
            Column("character", 440, 515),
            Column("workload", 515, 550),
            Column("period", 550, 600),
        ),
        {"PRÉ-REQUISITO": 361, "CARÁTER": 459, "CHS": 523, "PER": 553},
        ACTIVITY_CODE_RE,
    ),
}


@dataclass(frozen=True)
class Word:
    text: str
    x0: float
    top: float


Line = list[Word]


@dataclass
class Band:
    """Vertical slice of a page holding the body of one table."""

    layout: TableLayout
    title: str
    top: float
    bottom: float


@dataclass
class ParsedCurriculum:
    program: Program
    term: str
    warnings: list[str] = field(default_factory=list)


def parse_curriculum_pdf(
    content: bytes, program_code: str, source_url: str | None = None
) -> ParsedCurriculum:
    entries: list[CurriculumEntry] = []
    blocks: list[tuple[str | None, str | None, dict[str, int]]] = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        if not pdf.pages:
            raise CurriculumParseError(f"{program_code}: empty PDF")
        title = _parse_title(_lines(_words(pdf.pages[0])), program_code)
        track: str | None = None
        last_table: str | None = None
        for page in pdf.pages:
            words = _words(page)
            lines = _lines(words)
            for band in _bands(page, lines):
                # A table continued on the next page keeps its current track.
                if band.title != last_table:
                    track, last_table = None, band.title
                band_words = [w for w in words if band.top <= w.top < band.bottom]
                band_entries, track = _parse_band(band_words, band, track, program_code)
                entries.extend(band_entries)
            blocks.extend(_parse_summaries(lines, program_code))

    if not entries:
        raise CurriculumParseError(f"{program_code}: no curriculum rows found")

    required_hours: dict[str, int] = {}
    tracks: dict[tuple[str, str], Track] = {}
    for kind, name, hours in blocks:
        if kind is None or name is None:
            required_hours = hours
        else:
            key = (kind, normalize_track(name))
            if key in tracks and tracks[key].required_hours != hours:
                raise CurriculumParseError(f"{program_code}: conflicting totals for {kind} {name}")
            tracks[key] = Track(name=key[1], kind=kind.lower(), required_hours=hours)

    program = Program(
        code=program_code,
        name=title["name"],
        degree=title["degree"],
        campus=title["campus"],
        curriculum_version=title["version"],
        entries=entries,
        required_hours=required_hours,
        tracks=list(tracks.values()),
        source_url=source_url,
    )
    return ParsedCurriculum(program=program, term=title["term"], warnings=_check_totals(program))


def _check_totals(program: Program) -> list[str]:
    """Compare mandatory hours summed from the rows with the PDF's own totals.

    The program-wide total covers every mandatory row of every track; a track's
    total covers the common rows plus its own. A track name can appear as both
    a habilitação and an ênfase with different totals (the table labels do not
    say which), so a track passes when any of its blocks matches.
    """

    def mandatory_hours(track: str | None) -> int:
        return sum(
            e.workload_hours or 0
            for e in program.entries
            if e.category is EntryCategory.MANDATORY and (track is None or e.track in (None, track))
        )

    expected: dict[str | None, set[int]] = {}
    if "mandatory" in program.required_hours:
        expected[None] = {program.required_hours["mandatory"]}
    for track in program.tracks:
        if "mandatory" in track.required_hours:
            expected.setdefault(track.name, set()).add(track.required_hours["mandatory"])

    warnings = []
    for track, totals in expected.items():
        actual = mandatory_hours(track)
        if actual not in totals:
            label = f" (track {track})" if track else ""
            warnings.append(
                f"{program.code}{label}: mandatory rows add up to {actual}h, "
                f"the PDF says {' or '.join(f'{t}h' for t in sorted(totals))}"
            )
    return warnings


# --- Words and lines --------------------------------------------------------


def _words(page: Page) -> list[Word]:
    """Split the page's characters into words.

    Words are cut at spaces and at horizontal gaps, never at column boundaries.
    """
    words: list[Word] = []
    for line in _char_lines(page.chars):
        current: list[dict] = []
        for char in line:
            gap = float(char["x0"]) - float(current[-1]["x1"]) if current else 0.0
            if char["text"].isspace() or gap > WORD_GAP:
                if current:
                    words.append(_word(current))
                current = [] if char["text"].isspace() else [char]
            else:
                current.append(char)
        if current:
            words.append(_word(current))
    return words


def _char_lines(chars: list[dict], tolerance: float = 1.5) -> list[list[dict]]:
    lines: list[list[dict]] = []
    for char in sorted(chars, key=lambda c: (float(c["top"]), float(c["x0"]))):
        if lines and abs(float(lines[-1][0]["top"]) - float(char["top"])) <= tolerance:
            lines[-1].append(char)
        else:
            lines.append([char])
    return [sorted(line, key=lambda c: float(c["x0"])) for line in lines]


def _word(chars: list[dict]) -> Word:
    return Word("".join(c["text"] for c in chars), float(chars[0]["x0"]), float(chars[0]["top"]))


def _lines(words: Iterable[Word], tolerance: float = 2.0) -> list[Line]:
    lines: list[Line] = []
    for word in sorted(words, key=lambda w: (w.top, w.x0)):
        if lines and abs(lines[-1][0].top - word.top) <= tolerance:
            lines[-1].append(word)
        else:
            lines.append([word])
    return [sorted(line, key=lambda w: w.x0) for line in lines]


def _text(words: Iterable[Word]) -> str:
    return " ".join(w.text for w in words)


def normalize_track(name: str) -> str:
    """``"Biodiversidade E Meio Ambiente."`` -> ``"BIODIVERSIDADE E MEIO AMBIENTE"``."""
    return " ".join(name.upper().replace(".", " ").split())


# --- Page structure ---------------------------------------------------------


def _parse_title(lines: list[Line], program_code: str) -> dict[str, str | None]:
    title = next((_text(line) for line in lines if _text(line).startswith("CURSO DE ")), None)
    if title is None:
        raise TemplateChanged(f"{program_code}: course title line not found")
    match = TITLE_RE.match(title)
    if not match:
        raise TemplateChanged(f"{program_code}: unexpected title {title!r}")
    campus = next(
        (
            _text(line).removeprefix("CAMPUS ")
            for line in lines
            if _text(line).startswith("CAMPUS ")
        ),
        None,
    )
    return {**match.groupdict(), "campus": campus}


def _bands(page: Page, lines: list[Line]) -> list[Band]:
    headers: list[tuple[float, str, TableLayout]] = []
    stops: list[float] = [float(page.height)]
    for line in lines:
        first = line[0]
        text = _text(line)
        if first.text == "CÓDIGO" and first.x0 < 40:
            title = _text(w for w in line[1:] if w.x0 < 320)
            layout = LAYOUTS.get(title) or LAYOUTS.get(title.split()[0])
            if layout is None:
                raise TemplateChanged(f"unknown table header {text!r}")
            _check_anchors(line, layout, title)
            headers.append((first.top, title, layout))
        elif text.startswith((SUMMARY_START, LEGEND_START)):
            stops.append(first.top)

    bands = []
    for index, (top, title, layout) in enumerate(headers):
        next_top = headers[index + 1][0] if index + 1 < len(headers) else float(page.height)
        bottom = min([next_top, *[s for s in stops if s > top]]) - 2
        bands.append(Band(layout=layout, title=title, top=top + 6, bottom=bottom))
    return bands


def _check_anchors(line: Line, layout: TableLayout, title: str) -> None:
    positions = {w.text: w.x0 for w in line}
    for word, expected in layout.anchors.items():
        actual = positions.get(word)
        if actual is None or abs(actual - expected) > HEADER_TOLERANCE:
            raise TemplateChanged(
                f"table {title!r}: header {word!r} expected near x={expected}, found {actual}"
            )


# --- Rows -------------------------------------------------------------------


def _parse_band(
    words: list[Word], band: Band, track: str | None, program_code: str
) -> tuple[list[CurriculumEntry], str | None]:
    """Parse one table body. Returns its entries and the track in force at the end."""
    lines = _lines(words)
    # The "T P" sub-header under AULAS (subject tables only).
    if lines and _text(lines[0]) == "T P":
        lines = lines[1:]

    # Track labels are whole lines; take them out before splitting into rows.
    labels: list[tuple[float, str]] = []
    body: list[Word] = []
    for line in lines:
        if _is_track_label(line):
            labels.append((line[0].top, normalize_track(_text(line))))
        else:
            body.extend(line)

    columns: dict[str, list[Word]] = {col.name: [] for col in band.layout.columns}
    for word in body:
        column = next((c for c in band.layout.columns if c.x0 <= word.x0 < c.x1), None)
        if column is None:
            raise CurriculumParseError(f"{program_code}: text outside any column: {word.text!r}")
        columns[column.name].append(word)

    code_re = band.layout.code_re
    codes = [w for w in columns["code"] if code_re.match(w.text)]
    stray = [w.text for w in columns["code"] if not code_re.match(w.text)]
    if stray:
        raise CurriculumParseError(f"{program_code}: unexpected text in code column: {stray}")
    if codes:
        orphans = [w.text for w in body if w.top < codes[0].top - ROW_LEAD]
        if orphans:
            raise CurriculumParseError(f"{program_code}: text above the first row: {orphans}")
    elif body:
        raise CurriculumParseError(f"{program_code}: table rows without codes: {_text(body)!r}")

    entries = []
    starts = [w.top - ROW_LEAD for w in codes] + [band.bottom]
    for index, code in enumerate(codes):
        top, bottom = starts[index], starts[index + 1]
        for label_top, label in labels:
            if label_top < code.top:
                track = label
        labels = [(t, label) for t, label in labels if t >= code.top]
        cells = {
            name: [w for w in words if top <= w.top < bottom] for name, words in columns.items()
        }
        try:
            entries.append(_build_entry(code.text, cells, band.layout, track))
        except ValueError as error:
            raise CurriculumParseError(f"{program_code} {code.text}: {error}") from error
    if labels:
        raise CurriculumParseError(f"{program_code}: track label without rows: {labels[-1][1]!r}")
    return entries, track


def _is_track_label(line: Line) -> bool:
    first = line[0]
    return TRACK_LABEL_X[0] < first.x0 < TRACK_LABEL_X[1] and all(
        w.text.isupper() and not any(ch.isdigit() for ch in w.text) for w in line
    )


def _build_entry(
    code: str, cells: dict[str, list[Word]], layout: TableLayout, track: str | None
) -> CurriculumEntry:
    def cell(name: str) -> str:
        return _text(w for line in _lines(cells.get(name, [])) for w in line)

    if layout.category is None:
        character = cell("character")
        if character not in {"OBRIGATORIA", "ELETIVA", "OPTATIVA"}:
            raise CurriculumParseError(f"unknown activity character {character!r}")
        category = EntryCategory.ACTIVITY
        workload, extension = _int(cell("workload")), None
        theory = practice = class_hours = None
    else:
        category = layout.category
        workload, extension = _workload(cell("workload"))
        class_hours = _int(cell("class_hours"))
        theory, practice = _int(cell("theory")), _int(cell("practice"))

    name = cell("name")
    if not name:
        raise CurriculumParseError("missing name")
    return CurriculumEntry(
        subject_code=code,
        name=name,
        category=category,
        track=track,
        period=_int(cell("period")) or None,
        workload_hours=workload,
        extension_hours=extension,
        class_hours=class_hours,
        weekly_theory=theory,
        weekly_practice=practice,
        # Activity rows print a bare number of hours ("1200").
        requirements=parse_requirements(cell("requirements"), bare_hours=layout.category is None),
    )


def parse_requirements(text: str, bare_hours: bool = False) -> list[Requirement]:
    """Parse a prerequisite cell such as ``"720 horas BCC139"``.

    With ``bare_hours``, a number without "horas" also means hours. A zero-hour
    requirement is no requirement and is dropped.
    """
    tokens = text.split()
    requirements: list[Requirement] = []
    index = 0
    while index < len(tokens):
        token = tokens[index]
        hours: int | None = None
        if CODE_RE.match(token):
            requirement: Requirement | None = SubjectRequirement(code=token)
            index += 1
        elif token.isdigit() and index + 1 < len(tokens) and tokens[index + 1] == "horas":
            hours, index = int(token), index + 2
        elif token.isdigit() and bare_hours:
            hours, index = int(token), index + 1
        else:
            raise CurriculumParseError(f"cannot read prerequisite {text!r} (at {token!r})")
        if hours is not None:
            requirement = HoursRequirement(hours=hours) if hours > 0 else None
        if requirement is not None and requirement not in requirements:
            requirements.append(requirement)
    return requirements


def _workload(text: str) -> tuple[int | None, int | None]:
    if text in NULLS:
        return None, None
    match = re.fullmatch(r"(\d+)/(\d+)", text)
    if not match:
        raise CurriculumParseError(f"unexpected CHS/CHE value {text!r}")
    return int(match.group(1)), int(match.group(2))


def _int(text: str) -> int | None:
    if text in NULLS:
        return None
    if not text.isdigit():
        raise CurriculumParseError(f"expected a number, got {text!r}")
    return int(text)


# --- Summary ----------------------------------------------------------------


def _parse_summaries(
    lines: list[Line], program_code: str
) -> list[tuple[str | None, str | None, dict[str, int]]]:
    """Read the "Componentes Curriculares Exigidos" blocks on a page.

    Returns ``(kind, track name, hours)`` per block; kind and name are ``None``
    for the program-wide block ("Integralização no Curso").
    """
    start = next((i for i, line in enumerate(lines) if _text(line).startswith(SUMMARY_START)), None)
    if start is None:
        return []
    words = [
        w
        for line in lines[start:]
        if not _text(line).startswith(LEGEND_START) and line[0].top < _legend_top(lines)
        for w in line
    ]
    left = [w for w in words if w.x0 < SUMMARY_SPLIT_X]
    right = [w for w in words if w.x0 >= SUMMARY_SPLIT_X]
    return [
        block for half in (left, right) for block in _summary_blocks(_lines(half), program_code)
    ]


def _legend_top(lines: list[Line]) -> float:
    return next(
        (line[0].top for line in lines if _text(line).startswith(LEGEND_START)), float("inf")
    )


def _summary_blocks(
    lines: list[Line], program_code: str
) -> list[tuple[str | None, str | None, dict[str, int]]]:
    blocks: list[tuple[str | None, str | None, dict[str, int]]] = []
    title_parts: list[str] = []
    hours: dict[str, int] = {}

    def flush() -> None:
        if not hours:
            return
        title = " ".join(title_parts)
        match = SUMMARY_TITLE_RE.search(title)
        if not match:
            raise CurriculumParseError(f"{program_code}: unexpected summary title {title!r}")
        blocks.append((match["kind"], match["name"], dict(hours)))

    for line in lines:
        text = _text(line)
        if text.startswith(SUMMARY_START):
            flush()
            title_parts, hours = [], {}
            continue
        match = re.fullmatch(r"(.+?)\s+(\d+|null)", text)
        label = match and SUMMARY_LABELS.get(match.group(1))
        if match and label:
            if match.group(2) != "null":
                hours[label] = int(match.group(2))
        else:
            title_parts.append(text.replace("Carga Horária", "").strip())
    flush()
    return blocks
