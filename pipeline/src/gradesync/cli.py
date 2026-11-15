"""Command line: ``gradesync fetch|build|sync|load|refresh|discover``."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Annotated

import typer

from gradesync.model import Dataset
from gradesync.net import RawStore
from gradesync.refresh import plan
from gradesync.sources import get_adapter

app = typer.Typer(no_args_is_help=True, add_completion=False)

DEFAULT_CACHE = Path(".cache/raw")
DEFAULT_OUT = Path("out")

Institution = Annotated[str, typer.Argument(help="Institution code, e.g. ufop")]
Term = Annotated[str, typer.Option(help="Academic term, e.g. 2026/2")]
Cache = Annotated[Path, typer.Option(help="Where raw snapshots are stored")]
Out = Annotated[Path, typer.Option(help="Directory for the dataset JSON")]
DatabaseUrl = Annotated[str, typer.Option(envvar="DATABASE_URL", help="Postgres URL")]
SectionsOnly = Annotated[
    bool,
    typer.Option(help="Re-download only sections and seats, keeping the stored curricula"),
]


def _check_term(term: str) -> str:
    if not re.fullmatch(r"\d{4}/[12]", term):
        raise typer.BadParameter(f"expected a term like 2026/2, got {term!r}")
    return term


def dataset_path(out_dir: Path, institution: str, term: str) -> Path:
    return out_dir / f"{institution}-{term.replace('/', '-')}.json"


def _build(institution: str, term: str, cache: Path, out: Path) -> Dataset:
    dataset = get_adapter(institution).build(RawStore(cache), term)
    path = dataset_path(out, institution, term)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dataset.model_dump_json(indent=2) + "\n")
    typer.echo(
        f"{path}: {len(dataset.programs)} programs, {len(dataset.subjects)} subjects, "
        f"{len(dataset.sections)} sections, {len(dataset.warnings)} warnings"
    )
    for warning in dataset.warnings:
        typer.echo(f"  warning: {warning}", err=True)
    return dataset


@app.command()
def fetch(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    refresh: Annotated[bool, typer.Option(help="Re-download snapshots that already exist")] = False,
    sections_only: SectionsOnly = False,
) -> None:
    """Download raw sources into the snapshot store."""
    keys = get_adapter(institution).fetch(
        RawStore(cache), _check_term(term), refresh=refresh, refresh_sections=sections_only
    )
    typer.echo(f"Fetched {len(keys)} snapshots into {cache}")


@app.command()
def build(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    out: Out = DEFAULT_OUT,
    strict: Annotated[bool, typer.Option(help="Fail if the build produced warnings")] = False,
) -> None:
    """Build the canonical dataset from snapshots (no network access)."""
    dataset = _build(institution, _check_term(term), cache, out)
    if strict and dataset.warnings:
        raise typer.Exit(code=1)


@app.command()
def sync(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    out: Out = DEFAULT_OUT,
    sections_only: SectionsOnly = False,
) -> None:
    """Fetch fresh sources, then build."""
    fetch(institution, term, cache=cache, refresh=not sections_only, sections_only=sections_only)
    build(institution, term, cache=cache, out=out)


@app.command()
def load(
    dataset_file: Annotated[Path, typer.Argument(help="Dataset JSON written by build")],
    database_url: DatabaseUrl,
    current: Annotated[bool, typer.Option(help="Mark this term as the current one")] = False,
    force: Annotated[
        bool, typer.Option(help="Load even if this dataset was loaded already")
    ] = False,
) -> None:
    """Load a dataset into the database (one transaction)."""
    import psycopg

    from gradesync.load import load_dataset
    from gradesync.model import Dataset

    dataset = Dataset.model_validate_json(dataset_file.read_text())
    with psycopg.connect(database_url) as conn:
        stats = load_dataset(conn, dataset, make_current=current, force=force)
    if stats.skipped:
        typer.echo(f"{dataset.institution.code} {dataset.term}: already loaded, nothing to do")
    else:
        typer.echo(
            f"{dataset.institution.code} {dataset.term}: {stats.subjects} subjects, "
            f"{stats.programs} programs, {stats.entries} curriculum entries, "
            f"{stats.sections} sections ({stats.withdrawn} withdrawn)"
        )


@app.command()
def refresh(
    institution: Institution,
    database_url: DatabaseUrl,
    cache: Cache = DEFAULT_CACHE,
    out: Out = DEFAULT_OUT,
    sections_only: SectionsOnly = False,
    min_sections: Annotated[
        int, typer.Option(help="Sections a newer term needs before the site switches to it")
    ] = 1000,
    new_term_only: Annotated[
        bool, typer.Option(help="Only look for a newer term; leave the current one alone")
    ] = False,
) -> None:
    """Keep the database fresh, for scheduled runs.

    Switches to a newer term as soon as its timetable looks complete; otherwise
    re-downloads the current term (only its sections with --sections-only) and
    loads it.
    """
    import psycopg

    from gradesync.load import LoadStats, current_term, load_dataset

    def load_current(dataset: Dataset) -> LoadStats:
        # A connection per load: fetching takes minutes and must not hold one open.
        with psycopg.connect(database_url) as conn:
            return load_dataset(conn, dataset, make_current=True)

    adapter = get_adapter(institution)
    store = RawStore(cache)
    with psycopg.connect(database_url) as conn:
        current = current_term(conn, institution)
    todo = plan(current, adapter.offered_terms())

    if todo.newer:
        typer.echo(f"{institution}: {todo.newer} is published (showing {current or 'nothing'})")
        # Polled until it looks complete, so only its timetable at first.
        adapter.fetch(store, todo.newer, refresh_sections=True)
        dataset = _build(institution, todo.newer, cache, out)
        if len(dataset.sections) >= min_sections:
            # Curricula can change between terms: take fresh ones for the switch.
            adapter.fetch(store, todo.newer, refresh=True)
            dataset = _build(institution, todo.newer, cache, out)
            load_current(dataset)
            typer.echo(f"{institution}: now showing {todo.newer}")
            return
        typer.echo(
            f"{institution}: {todo.newer} has only {len(dataset.sections)} sections "
            f"(need {min_sections}); keeping {current or 'nothing'}"
        )

    if new_term_only:
        if not todo.newer:
            typer.echo(f"{institution}: no term newer than {current}")
        return
    if todo.current is None:
        typer.echo(f"{institution}: the current term {current} is no longer offered", err=True)
        raise typer.Exit(code=1)
    adapter.fetch(store, todo.current, refresh=not sections_only, refresh_sections=sections_only)
    dataset = _build(institution, todo.current, cache, out)
    stats = load_current(dataset)
    if stats.skipped:
        typer.echo(f"{institution} {todo.current}: unchanged")
    else:
        typer.echo(
            f"{institution} {todo.current}: {stats.sections} sections loaded "
            f"({stats.withdrawn} withdrawn)"
        )


@app.command()
def discover(institution: Institution, cache: Cache = DEFAULT_CACHE) -> None:
    """Compare the institution's public catalog with the program registry."""
    adapter = get_adapter(institution)
    if not hasattr(adapter, "discover"):
        raise typer.BadParameter(f"{institution} has no discovery step")
    result = adapter.discover(RawStore(cache))  # type: ignore[attr-defined]
    clean = True
    for slug, codes in result.unregistered.items():
        clean = False
        typer.echo(f"new program codes on {slug}: {', '.join(codes)}")
    for slug in result.unknown_slugs:
        clean = False
        typer.echo(f"catalog page without a curriculum code: {slug}")
    for code in result.missing:
        clean = False
        typer.echo(f"registered code no longer linked from the catalog: {code}")
    typer.echo("Registry matches the catalog." if clean else "Update programs.py to match.")
    if not clean:
        raise typer.Exit(code=1)


if __name__ == "__main__":
    app()
