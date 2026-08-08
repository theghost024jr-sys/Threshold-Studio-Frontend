from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = {
    "index.html", "engine.html", "discover.html", "ethos.html", "invitation.html", "housegarden.html",
    "css/core.css", "js/nav.js", "js/chamber-loader.js", "js/environment.js",
    "assets/core-images/threshold-logo.svg",
}


class References(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.paths: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in {"href", "src"} and value:
                self.paths.append(value)


def validate_core(root: Path = ROOT) -> int:
    core = root / "publish" / "core"
    missing = sorted(path for path in REQUIRED if not (core / path).is_file())
    if missing:
        raise FileNotFoundError(f"Anchor is missing: {', '.join(missing)}")

    checked = 0
    for html in core.glob("*.html"):
        parser = References()
        parser.feed(html.read_text(encoding="utf-8"))
        for reference in parser.paths:
            parsed = urlsplit(reference)
            if parsed.scheme or parsed.path.startswith("/") or not parsed.path:
                continue
            target = (html.parent / unquote(parsed.path)).resolve()
            if not target.is_relative_to(core.resolve()) or not target.is_file():
                raise FileNotFoundError(f"Broken Anchor reference in {html.name}: {reference}")
            checked += 1
    return checked


if __name__ == "__main__":
    count = validate_core()
    print(f"Validated Anchor core: {count} local references")