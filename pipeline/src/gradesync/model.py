"""Canonical dataset shared by every institution adapter.

An adapter (``gradesync.sources.<institution>``) turns raw snapshots into one
:class:`Dataset` per academic term. Everything downstream (validation, the
database loader, the web app) only knows this shape, so adding a university
means writing an adapter, not changing the rest of the system.

Codes are the institution's own identifiers (e.g. ``CSI102`` for a subject,
``SJM`` for a program at UFOP). They are the natural keys used for upserts.
"""

from __future__ import annotations

from datetime import datetime, time
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

SCHEMA_VERSION = 1


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class Weekday(StrEnum):
    MON = "MON"
    TUE = "TUE"
    WED = "WED"
    THU = "THU"
    FRI = "FRI"
    SAT = "SAT"
    SUN = "SUN"


class ClassKind(StrEnum):
    THEORY = "theory"
    PRACTICE = "practice"


class EntryCategory(StrEnum):
    MANDATORY = "mandatory"
    ELECTIVE = "elective"
    OPTIONAL = "optional"
    ACTIVITY = "activity"


# --- Organisation -----------------------------------------------------------


class Institution(Model):
    code: str
    name: str
    timezone: str


class Department(Model):
    code: str
    name: str
    display_name: str | None = None


class Subject(Model):
    """A subject (disciplina) as the institution catalogues it."""

    code: str
    name: str
    display_name: str | None = None
    department_code: str | None = None
    syllabus: str | None = None


# --- Curricula --------------------------------------------------------------


class SubjectRequirement(Model):
    type: Literal["subject"] = "subject"
    code: str


class HoursRequirement(Model):
    """Minimum number of completed workload hours (e.g. "720 horas")."""

    type: Literal["hours"] = "hours"
    hours: int = Field(gt=0)


Requirement = Annotated[SubjectRequirement | HoursRequirement, Field(discriminator="type")]


class CurriculumEntry(Model):
    """One subject or activity inside a program's curriculum.

    ``requirements`` must all be satisfied (UFOP lists prerequisites as a
    conjunction). ``period`` is the recommended semester, absent for electives.
    ``track`` names the specialisation (habilitação/ênfase) the entry belongs
    to; ``None`` means it applies to every student of the program.
    """

    subject_code: str
    name: str
    category: EntryCategory
    track: str | None = None
    period: int | None = Field(default=None, ge=1)
    workload_hours: int | None = Field(default=None, ge=0)
    extension_hours: int | None = Field(default=None, ge=0)
    class_hours: int | None = Field(default=None, ge=0)
    weekly_theory: int | None = Field(default=None, ge=0)
    weekly_practice: int | None = Field(default=None, ge=0)
    requirements: list[Requirement] = Field(default_factory=list)


class Track(Model):
    """A specialisation inside a program, with its own hour requirements."""

    name: str
    kind: str
    required_hours: dict[str, int] = Field(default_factory=dict)


class Program(Model):
    """A degree program (curso) with the curriculum in force for the term.

    ``required_hours`` holds the totals needed to graduate, keyed by category
    (``mandatory``, ``elective``, ``activities``, ``extension``, ``total``...).
    Programs with specialisations list them in ``tracks`` instead or as well.
    """

    code: str
    name: str
    display_name: str | None = None
    degree: str | None = None
    campus: str | None = None
    curriculum_version: str | None = None
    entries: list[CurriculumEntry]
    required_hours: dict[str, int] = Field(default_factory=dict)
    tracks: list[Track] = Field(default_factory=list)
    source_url: str | None = None

    @model_validator(mode="after")
    def _unique_entries(self) -> Program:
        seen: set[tuple[str, str | None]] = set()
        for entry in self.entries:
            key = (entry.subject_code, entry.track)
            if key in seen:
                raise ValueError(f"{self.code}: {entry.subject_code} listed twice")
            seen.add(key)
        return self


# --- Timetable --------------------------------------------------------------


class Meeting(Model):
    day: Weekday
    start: time
    end: time
    kind: ClassKind | None = None

    @model_validator(mode="after")
    def _ordered(self) -> Meeting:
        if self.end <= self.start:
            raise ValueError(f"meeting ends before it starts: {self.start}-{self.end}")
        return self


class Instructor(Model):
    name: str
    kinds: list[ClassKind] = Field(default_factory=list)


class Section(Model):
    """One offered class (turma) of a subject in the term."""

    subject_code: str
    code: str
    department_code: str
    meetings: list[Meeting] = Field(default_factory=list)
    instructors: list[Instructor] = Field(default_factory=list)
    delivery: str | None = None
    modality: str | None = None
    location: str | None = None
    language: str | None = None
    seats: int | None = Field(default=None, ge=0)
    enrolled: int | None = Field(default=None, ge=0)
    reservation: str | None = None


# --- Dataset ----------------------------------------------------------------


class SourceRef(Model):
    key: str
    url: str
    fetched_at: datetime
    sha256: str


class Dataset(Model):
    schema_version: int = SCHEMA_VERSION
    institution: Institution
    term: str
    generated_at: datetime
    departments: list[Department]
    subjects: list[Subject]
    programs: list[Program]
    sections: list[Section]
    sources: list[SourceRef]
    warnings: list[str] = Field(default_factory=list)
