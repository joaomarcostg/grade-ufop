"""Polite HTTP access and a raw snapshot store.

Every source is fetched once into a :class:`RawStore` and parsed only from there.
That split keeps parsing deterministic: the same snapshots always produce the
same dataset, and a build can be replayed offline (or in tests) without touching
the university's servers.
"""

from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlsplit

import httpx

USER_AGENT = "gradesync/0.1 (+https://github.com/joaomarcostg/grade-ufop)"


class FetchError(RuntimeError):
    pass


class Fetcher:
    """HTTP client that waits between requests to the same host and retries failures.

    ``delays`` maps a host to the minimum number of seconds between two requests
    to it (honour ``Crawl-delay`` from robots.txt here). Hosts not listed use
    ``default_delay``.
    """

    def __init__(
        self,
        delays: dict[str, float] | None = None,
        default_delay: float = 1.0,
        retries: int = 3,
        timeout: float = 60.0,
    ) -> None:
        self._delays = delays or {}
        self._default_delay = default_delay
        self._retries = retries
        self._last_request: dict[str, float] = {}
        self._client = httpx.Client(
            headers={"User-Agent": USER_AGENT},
            timeout=timeout,
            follow_redirects=True,
        )

    def __enter__(self) -> Fetcher:
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    def close(self) -> None:
        self._client.close()

    def request(self, method: str, url: str, **kwargs: object) -> httpx.Response:
        host = urlsplit(url).hostname or ""
        last_error: Exception | None = None
        for attempt in range(self._retries):
            self._wait_for(host)
            try:
                response = self._client.request(method, url, **kwargs)  # type: ignore[arg-type]
            except httpx.TransportError as error:
                last_error = error
            else:
                if response.status_code < 500:
                    response.raise_for_status()
                    return response
                last_error = FetchError(f"{method} {url} -> HTTP {response.status_code}")
            time.sleep(2**attempt)
        raise FetchError(f"{method} {url} failed after {self._retries} attempts") from last_error

    def get(self, url: str, **kwargs: object) -> httpx.Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs: object) -> httpx.Response:
        return self.request("POST", url, **kwargs)

    def _wait_for(self, host: str) -> None:
        delay = self._delays.get(host, self._default_delay)
        elapsed = time.monotonic() - self._last_request.get(host, float("-inf"))
        if elapsed < delay:
            time.sleep(delay - elapsed)
        self._last_request[host] = time.monotonic()


@dataclass(frozen=True)
class Snapshot:
    key: str
    url: str
    fetched_at: datetime
    sha256: str
    content: bytes


class RawStore:
    """Directory of raw source files plus a manifest recording where each came from.

    Keys are relative paths such as ``ufop/timetable/2026-2/DECSI.html``.
    """

    MANIFEST = "manifest.json"

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        manifest_path = self.root / self.MANIFEST
        self._manifest: dict[str, dict[str, str]] = (
            json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
        )

    def has(self, key: str) -> bool:
        return key in self._manifest and (self.root / key).exists()

    def put(self, key: str, url: str, content: bytes) -> Snapshot:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        fetched_at = datetime.now(UTC).replace(microsecond=0)
        digest = hashlib.sha256(content).hexdigest()
        self._manifest[key] = {"url": url, "fetched_at": fetched_at.isoformat(), "sha256": digest}
        self._save_manifest()
        return Snapshot(key, url, fetched_at, digest, content)

    def get(self, key: str) -> Snapshot:
        if not self.has(key):
            raise KeyError(f"snapshot {key!r} is missing; run the fetch step first")
        meta = self._manifest[key]
        return Snapshot(
            key=key,
            url=meta["url"],
            fetched_at=datetime.fromisoformat(meta["fetched_at"]),
            sha256=meta["sha256"],
            content=(self.root / key).read_bytes(),
        )

    def keys(self, prefix: str = "") -> list[str]:
        return sorted(k for k in self._manifest if k.startswith(prefix))

    def _save_manifest(self) -> None:
        tmp = self.root / f"{self.MANIFEST}.tmp"
        tmp.write_text(json.dumps(self._manifest, indent=2, sort_keys=True))
        tmp.replace(self.root / self.MANIFEST)
