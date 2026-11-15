"""UFOP class timetable ("Horário de Aulas", zeppelin10.ufop.br/HorarioAulas).

The site is a JSF (Mojarra + PrimeFaces) form, but department pages are plain
form posts, so no browser is needed: load the page, submit the term filter, then
post each department link with the same view state.
"""

from __future__ import annotations

import html as html_lib
import re
from collections.abc import Iterator
from datetime import time
from urllib.parse import urljoin

from lxml import html

from gradesync.model import ClassKind, Department, Instructor, Meeting, Section, Subject, Weekday
from gradesync.net import Fetcher, RawStore

BASE_URL = "https://zeppelin10.ufop.br/HorarioAulas/"

DAYS = {
    "SEG": Weekday.MON,
    "TER": Weekday.TUE,
    "QUA": Weekday.WED,
    "QUI": Weekday.THU,
    "SEX": Weekday.FRI,
    "SAB": Weekday.SAT,
    "DOM": Weekday.SUN,
}
KINDS = {"T": ClassKind.THEORY, "P": ClassKind.PRACTICE}
MEETING_RE = re.compile(
    r"^(?P<day>[A-Z]{3})\s+(?P<start>\d{1,2}:\d{2})\s*-\s*(?P<end>\d{1,2}:\d{2})\s*(?:\((?P<kind>[TP])\))?$"
)
INSTRUCTOR_RE = re.compile(r"^(?P<name>.+?)\s*(?:\((?P<kinds>[TP](?:\+[TP])*)\))?$")
FIELDS = (
    "codigo",
    "disciplina",
    "modalidade",
    "turma",
    "horario",
    "oferta",
    "vagas",
    "matriculados",
    "professores",
    "predio",
    "idioma",
    "reserva",
)


class TimetableParseError(ValueError):
    pass


def snapshot_prefix(term: str) -> str:
    return f"ufop/timetable/{term.replace('/', '-')}/"


def parse_terms(page_html: str) -> list[str]:
    """Terms the timetable offers, newest first."""
    terms = set(re.findall(r'<option[^>]*value="(\d{4}/[12])"', page_html))
    return sorted(terms, key=lambda t: (int(t[:4]), int(t[5])), reverse=True)


def fetch_terms(fetcher: Fetcher) -> list[str]:
    return parse_terms(fetcher.get(BASE_URL).text)


# --- Fetching ---------------------------------------------------------------


def fetch_timetable(
    fetcher: Fetcher, store: RawStore, term: str, departments: list[str] | None = None
) -> list[str]:
    """Save the department index and each department page for ``term``.

    Returns the snapshot keys written.
    """
    first = fetcher.get(BASE_URL).text
    terms = parse_terms(first)
    if term not in terms:
        raise TimetableParseError(f"term {term} is not offered (available: {', '.join(terms)})")

    index = _post(fetcher, first, term, {"formPrincipal:botaoEnviar": "Filtrar"})
    prefix = snapshot_prefix(term)
    keys = [store.put(f"{prefix}index.html", BASE_URL, index.encode()).key]

    links = _department_links(index)
    wanted = set(departments) if departments else set(links)
    unknown = wanted - set(links)
    if unknown:
        raise TimetableParseError(f"unknown departments: {', '.join(sorted(unknown))}")

    for code in sorted(wanted):
        page = _post(fetcher, index, term, {links[code]: links[code]})
        if "codigoDepartamento" in page:
            # Still the index: the view state was rejected and navigation failed.
            raise TimetableParseError(f"{code}: the department page did not open")
        keys.append(store.put(f"{prefix}{code}.html", f"{BASE_URL}#{code}", page.encode()).key)
    return keys


def _post(fetcher: Fetcher, page: str, term: str, extra: dict[str, str]) -> str:
    view_state = re.search(r'name="javax\.faces\.ViewState"[^>]*value="([^"]+)"', page)
    action = re.search(r'<form id="formPrincipal"[^>]*action="([^"]+)"', page)
    if not view_state or not action:
        raise TimetableParseError("timetable form not found; the page layout changed")
    data = {
        "formPrincipal": "formPrincipal",
        "formPrincipal:anoSemestre": term,
        "formPrincipal:pesquisa": "",
        "javax.faces.ViewState": view_state.group(1),
        **extra,
    }
    url = urljoin(BASE_URL, html_lib.unescape(action.group(1)))
    return fetcher.post(url, data=data).text


def _department_links(index_html: str) -> dict[str, str]:
    """Map department code -> the form field that opens its page."""
    links = re.findall(
        r"\{'(formPrincipal:tabela:\d+:j_idt\d+)'[^}]*\}.*?codigoDepartamento\">([^<]+)<",
        index_html,
        re.S,
    )
    if not links:
        raise TimetableParseError("no departments in the timetable index")
    return {code.strip(): field for field, code in links}


# --- Parsing ----------------------------------------------------------------


def parse_departments(index_html: bytes) -> list[Department]:
    tree = html.fromstring(index_html)
    departments = []
    for row in tree.xpath('//table[@id="formPrincipal:tabela"]/tbody/tr'):
        code = _span(row, "codigoDepartamento")
        name = _span(row, "descricao")
        if code:
            departments.append(Department(code=code, name=name))
    if not departments:
        raise TimetableParseError("no departments in the timetable index")
    return departments


def parse_department_page(
    page_html: bytes, department_code: str
) -> tuple[list[Subject], list[Section]]:
    """Return the subjects and sections listed on one department page.

    Takes the raw bytes: the pages carry an XML encoding declaration, which lxml
    only accepts on undecoded input.
    """
    tree = html.fromstring(page_html)
    rows = tree.xpath('//table[@id="formPrincipal:tabela"]/tbody/tr')
    subjects: dict[str, Subject] = {}
    sections: list[Section] = []
    for row in rows:
        values = {name: _span(row, name) for name in FIELDS}
        if not values["codigo"]:
            continue
        code = values["codigo"]
        try:
            subject = Subject(
                code=code,
                name=values["disciplina"],
                department_code=department_code,
                syllabus=_syllabus(row),
            )
            section = Section(
                subject_code=code,
                code=values["turma"],
                department_code=department_code,
                meetings=list(parse_meetings(values["horario"])),
                instructors=parse_instructors(values["professores"]),
                delivery=values["oferta"] or None,
                modality=values["modalidade"] or None,
                location=values["predio"] or None,
                language=values["idioma"] or None,
                seats=_int(values["vagas"]),
                enrolled=_int(values["matriculados"]),
                reservation=values["reserva"] or None,
            )
        except ValueError as error:
            raise TimetableParseError(f"{department_code} {code}: {error}") from error
        subjects.setdefault(code, subject)
        sections.append(section)
    return list(subjects.values()), sections


def parse_meetings(text: str) -> Iterator[Meeting]:
    """Parse ``"TER 21:00-22:40(T) / QUI 19:00-20:40(P)"``."""
    for part in filter(None, (p.strip() for p in text.split("/"))):
        match = MEETING_RE.match(part)
        if not match:
            raise TimetableParseError(f"unexpected schedule {part!r} in {text!r}")
        if match["day"] not in DAYS:
            raise TimetableParseError(f"unknown weekday {match['day']!r} in {text!r}")
        yield Meeting(
            day=DAYS[match["day"]],
            start=_time(match["start"]),
            end=_time(match["end"]),
            kind=KINDS.get(match["kind"] or ""),
        )


def parse_instructors(text: str) -> list[Instructor]:
    """Parse ``"ANA SILVA(T) / JOAO SOUZA(P)"`` (kinds are optional)."""
    instructors: list[Instructor] = []
    for part in filter(None, (p.strip() for p in re.split(r"\s*/\s*|\s*,\s*", text))):
        match = INSTRUCTOR_RE.match(part)
        if not match:
            raise TimetableParseError(f"unexpected instructor {part!r}")
        kinds = [KINDS[k] for k in (match["kinds"] or "").split("+") if k]
        instructors.append(Instructor(name=match["name"], kinds=kinds))
    return instructors


def _span(row: html.HtmlElement, field: str) -> str:
    found = row.xpath(f'.//span[substring(@id, string-length(@id) - {len(field)}) = ":{field}"]')
    return " ".join(found[0].text_content().split()) if found else ""


def _syllabus(row: html.HtmlElement) -> str | None:
    link = row.xpath('.//a[.//span[contains(@id, ":disciplina")]]')
    title = link[0].get("title") if link else None
    return " ".join(title.split()) if title and title.strip() else None


def _time(text: str) -> time:
    hours, minutes = map(int, text.split(":"))
    return time(hours, minutes)


def _int(text: str) -> int | None:
    return int(text) if text.isdigit() else None
