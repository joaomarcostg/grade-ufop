"""What a scheduled refresh should do with the terms an institution offers.

The site shows one term at a time (the database's current term). A refresh
keeps that term's sections and seats fresh, and switches to a newer term as
soon as the institution publishes its timetable, so nobody has to remember to
load the next semester.
"""

from __future__ import annotations

from dataclasses import dataclass


def term_key(term: str) -> tuple[int, int]:
    """Sort key for terms like ``2026/2``."""
    year, half = term.split("/")
    return int(year), int(half)


@dataclass(frozen=True)
class Plan:
    #: A term newer than the current one, to load and switch to if it looks complete.
    newer: str | None
    #: The term to refresh when there is no switch; None when it is no longer offered.
    current: str | None


def plan(current: str | None, offered: list[str]) -> Plan:
    newest = max(offered, key=term_key, default=None)
    newer = newest if newest and (current is None or term_key(newest) > term_key(current)) else None
    return Plan(newer=newer, current=current if current in offered else None)
