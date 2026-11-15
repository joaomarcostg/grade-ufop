"""Command line: ``gradesync fetch|build|sync|discover``."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Annotated

import typer

from gradesync.net import RawStore
from gradesync.sources import get_adapter

app = typer.Typer(no_args_is_help=True, add_completion=False)

DEFAULT_CACHE = Path(".cache/raw")
DEFAULT_OUT = Path("out")

Institution = Annotated[str, typer.Argument(help="Institution code, e.g. ufop")]
Term = Annotated[str, typer.Option(help="Academic term, e.g. 2026/2")]
Cache = Annotated[Path, typer.Option(help="Where raw snapshots are stored")]


def _check_term(term: str) -> str:
    if not re.fullmatch(r"\d{4}/[12]", term):
        raise typer.BadParameter(f"expected a term like 2026/2, got {term!r}")
    return term


def dataset_path(out_dir: Path, institution: str, term: str) -> Path:
    return out_dir / f"{institution}-{term.replace('/', '-')}.json"


@app.command()
def fetch(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    refresh: Annotated[bool, typer.Option(help="Re-download snapshots that already exist")] = False,
) -> None:
    """Download raw sources into the snapshot store."""
    keys = get_adapter(institution).fetch(RawStore(cache), _check_term(term), refresh=refresh)
    typer.echo(f"Fetched {len(keys)} snapshots into {cache}")


@app.command()
def build(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    out: Annotated[Path, typer.Option(help="Directory for the dataset JSON")] = DEFAULT_OUT,
    strict: Annotated[bool, typer.Option(help="Fail if the build produced warnings")] = False,
) -> None:
    """Build the canonical dataset from snapshots (no network access)."""
    dataset = get_adapter(institution).build(RawStore(cache), _check_term(term))
    path = dataset_path(out, institution, term)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dataset.model_dump_json(indent=2) + "\n")
    typer.echo(
        f"{path}: {len(dataset.programs)} programs, {len(dataset.subjects)} subjects, "
        f"{len(dataset.sections)} sections, {len(dataset.warnings)} warnings"
    )
    for warning in dataset.warnings:
        typer.echo(f"  warning: {warning}", err=True)
    if strict and dataset.warnings:
        raise typer.Exit(code=1)


@app.command()
def sync(
    institution: Institution,
    term: Term,
    cache: Cache = DEFAULT_CACHE,
    out: Annotated[Path, typer.Option(help="Directory for the dataset JSON")] = DEFAULT_OUT,
) -> None:
    """Fetch fresh sources, then build."""
    fetch(institution, term, cache=cache, refresh=True)
    build(institution, term, cache=cache, out=out)


@app.command()
def load(
    dataset_file: Annotated[Path, typer.Argument(help="Dataset JSON written by build")],
    database_url: Annotated[str, typer.Option(envvar="DATABASE_URL", help="Postgres URL")],
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
