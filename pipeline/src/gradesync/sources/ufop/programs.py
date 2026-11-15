"""Registry of UFOP programs (cursos) and their academic-system codes.

The code is what ``SistemaAcademico/MatrizCurricular?codCurso=<code>`` expects.
Most codes come from the course pages on seja.ufop.br (``gradesync discover
ufop`` re-checks them); the ones marked ``found_via`` are not linked there and
were confirmed against the curriculum endpoint directly.

Keeping this list in code makes builds reproducible and lets a reviewer see
exactly which programs a dataset covers.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProgramRef:
    code: str
    catalog_slug: str | None  # seja.ufop.br/cursos/<slug>
    found_via: str | None = None


# The catalog page links a static PDF instead of the academic system.
STATIC_PDF = "curriculum endpoint (catalog links a static PDF)"

PROGRAMS: tuple[ProgramRef, ...] = (
    ProgramRef("ADM", "administracao"),
    ProgramRef("ADP", "administracao-publica", found_via=STATIC_PDF),
    ProgramRef("D06", "administracao-publica-ead"),
    ProgramRef("ARQ", "arquitetura-e-urbanismo"),
    ProgramRef("ACB", "artes-cenicas"),
    ProgramRef("ACL", "artes-cenicas"),
    ProgramRef("COM", "ciencia-da-computacao"),
    ProgramRef("ALI", "ciencia-e-tecnologia-de-alimentos"),
    ProgramRef("CBB", "ciencias-biologicas"),
    ProgramRef("CBL", "ciencias-biologicas"),
    ProgramRef("ECO", "ciencias-economicas"),
    ProgramRef("DIR", "direito"),
    ProgramRef("EFB", "educacao-fisica"),
    ProgramRef("EFL", "educacao-fisica"),
    ProgramRef("AMB", "engenharia-ambiental"),
    ProgramRef("CIV", "engenharia-civil"),
    ProgramRef("CJM", "engenharia-de-computacao"),
    ProgramRef("AUT", "engenharia-de-controle-e-automacao"),
    ProgramRef("MIN", "engenharia-de-minas"),
    ProgramRef("PJM", "engenharia-de-producao-jm"),
    ProgramRef("PRO", "engenharia-de-producao-op"),
    ProgramRef("EJM", "engenharia-eletrica"),
    ProgramRef("GEO", "engenharia-geologica"),
    ProgramRef("MEC", "engenharia-mecanica"),
    ProgramRef("MET", "engenharia-metalurgica"),
    ProgramRef("URB", "engenharia-urbana"),
    ProgramRef("FAR", "farmacia"),
    ProgramRef("FLB", "filosofia"),
    ProgramRef("FLL", "filosofia"),
    ProgramRef("FSB", "fisica"),
    ProgramRef("FSL", "fisica"),
    ProgramRef("D07", "geografia-ead"),
    ProgramRef("HIB", "historia"),
    ProgramRef("HIL", "historia"),
    ProgramRef("BIA", "inteligencia-artificial-op", found_via=STATIC_PDF),
    ProgramRef("JOR", "jornalismo"),
    ProgramRef("LTT", "letras"),
    ProgramRef("LTE", "letras"),
    ProgramRef("LTP", "letras"),
    ProgramRef("LTI", "letras"),
    ProgramRef("MTB", "matematica", found_via="iceb.ufop.br/matematica"),
    ProgramRef("MTL", "matematica", found_via="curriculum endpoint"),
    ProgramRef("D05", "matematica-ead"),
    ProgramRef("MED", "medicina"),
    ProgramRef("MUL", "museologia"),
    ProgramRef("MUS", "musica", found_via=STATIC_PDF),
    ProgramRef("NUT", "nutricao"),
    ProgramRef("D04", "pedagogia-ead"),
    ProgramRef("PEI", "pedagogia-ipatinga", found_via=STATIC_PDF),
    ProgramRef("PED", "pedagogia-mariana"),
    ProgramRef("QUI", "quimica-industrial"),
    ProgramRef("QLI", "quimica"),
    ProgramRef("SER", "servico-social"),
    ProgramRef("SJM", "sistemas-de-informacao"),
    ProgramRef("TUR", "turismo", found_via="timetable seat reservations"),
)

# Catalog entries with no curriculum in the academic system yet.
PENDING_SLUGS = {
    "estatistica-e-ciencia-de-dados": "catalog says 'Em breve'",
    "inteligencia-artificial-jm": "only a council PDF; no code in the academic system yet",
}
