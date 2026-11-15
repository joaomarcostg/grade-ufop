"""Readable names from the institution's all-caps, accent-free names.

UFOP's sources write names like ``PROGRAMACAO DE COMPUTADORES I``. The syllabi
in the timetable, however, are ordinary Portuguese text with accents. We learn
how each word is spelled from those texts (a lexicon keyed by the word without
accents) and then title-case names with Portuguese rules:
``Programação de Computadores I``.

Everything here is deterministic: the same texts always give the same lexicon.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter, defaultdict
from collections.abc import Iterable

WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")
ROMAN_RE = re.compile(r"^(?=[IVXL]+$)L?X{0,3}(IX|IV|V?I{0,3})$")
# Lowercase inside a name (articles, prepositions, conjunctions).
MINOR_WORDS = {
    "a", "à", "ao", "aos", "as", "às", "com", "da", "das", "de", "do", "dos",
    "e", "em", "na", "nas", "no", "nos", "o", "os", "ou", "para", "pela",
    "pelas", "pelo", "pelos", "por", "sem", "sob", "um", "uma",
}  # fmt: skip
# Unambiguous Portuguese endings, for words no text taught us.
SUFFIXES = (("CAO", "ção"), ("COES", "ções"), ("AO", "ão"), ("OES", "ões"))
# Kept upper case wherever they appear.
ACRONYMS = {
    "BIM", "CAD", "CAE", "CAM", "EAD", "ERP", "GPS", "HDL", "IA", "SIG", "SQL",
    "TCC", "TI", "TIC", "TICS", "UFOP", "VHDL",
}  # fmt: skip


def fold(word: str) -> str:
    """``"Programação"`` -> ``"PROGRAMACAO"``: the key the sources use."""
    decomposed = unicodedata.normalize("NFD", word)
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").upper()


def build_lexicon(texts: Iterable[str]) -> dict[str, str]:
    """Map each folded word to its most frequent lower-case spelling.

    Ties go to the accented spelling, then alphabetically, so the result does
    not depend on the order of the texts.
    """
    counts: dict[str, Counter[str]] = defaultdict(Counter)
    for text in texts:
        for word in WORD_RE.findall(text):
            # All-caps words only teach us something when they carry accents.
            if len(word) > 1 and (not word.isupper() or fold(word) != word.upper()):
                counts[fold(word)][word.lower()] += 1
    return {
        key: min(forms.items(), key=lambda kv: (-kv[1], kv[0] == fold(kv[0]).lower(), kv[0]))[0]
        for key, forms in counts.items()
    }


def display_name(raw: str, lexicon: dict[str, str]) -> str:
    """Title-case an all-caps name, restoring accents the lexicon knows."""
    words = raw.split()
    result = []
    for index, token in enumerate(words):
        parts = token.split("-")
        result.append("-".join(_word(part, lexicon, first=index == 0) for part in parts))
    return " ".join(result)


def _word(token: str, lexicon: dict[str, str], *, first: bool) -> str:
    match = re.match(r"^(\W*)(.*?)(\W*)$", token)
    if not match or not match.group(2):
        return token
    lead, core, trail = match.groups()
    upper = core.upper()
    if upper in ACRONYMS or ROMAN_RE.match(upper) or any(ch.isdigit() for ch in core):
        word = upper
    else:
        word = lexicon.get(fold(core)) or _guess(core)
        if first or word not in MINOR_WORDS:
            word = word[:1].upper() + word[1:]
    return f"{lead}{word}{trail}"


def _guess(word: str) -> str:
    upper = word.upper()
    for ending, replacement in SUFFIXES:
        if upper.endswith(ending) and len(upper) > len(ending) + 1:
            return upper[: -len(ending)].lower() + replacement
    return word.lower()
