"""Institution adapters.

Each adapter module exposes ``fetch(store, term, refresh=...)`` and
``build(store, term) -> Dataset``; ``discover(store)`` is optional. Register new
institutions here.
"""

from __future__ import annotations

from types import ModuleType
from typing import Protocol, cast

from gradesync.model import Dataset
from gradesync.net import RawStore


class Adapter(Protocol):
    def fetch(self, store: RawStore, term: str, *, refresh: bool = False) -> list[str]: ...

    def build(self, store: RawStore, term: str) -> Dataset: ...


def get_adapter(institution: str) -> Adapter:
    module: ModuleType
    if institution == "ufop":
        from gradesync.sources.ufop import adapter as module
    else:
        raise KeyError(
            f"no adapter for institution {institution!r} (available: {', '.join(INSTITUTIONS)})"
        )
    return cast(Adapter, module)


INSTITUTIONS = ("ufop",)
