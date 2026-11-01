from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

try:
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from threshold_paths import ThresholdPaths, load_threshold_paths


GLYPH_NAME_PATTERN = re.compile(r"glyph", re.IGNORECASE)
GLYPH_HEADING_PATTERN = re.compile(r"^#\s+.*glyph", re.IGNORECASE | re.MULTILINE)
TITLE_PATTERN = re.compile(r"^title:\s*[\"']?(.+?)[\"']?\s*$", re.IGNORECASE | re.MULTILINE)
HEADING_PATTERN = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)
FRONTMATTER_PATTERN = re.compile(r"^---\s*\n.*?\n---\s*\n?", re.DOTALL)
EMBED_PATTERN = re.compile(r"!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")
EXCLUDED_DIRECTORIES = {"_publish_candidates", ".git", ".obsidian", ".trash"}

CANONICAL_PRIMITIVES = {
    "strokeEffects": {
        "straight": "structure",
        "curved": "emotion",
        "broken": "instability",
        "repeated": "amplification",
    },
    "orientationEffects": {
        "up": "emergence",
        "down": "descent",
        "left": "memory",
        "right": "intention",
    },
    "spacingEffects": {
        "tight": "compression",
        "wide": "openness",
        "overlap": "entanglement",
    },
    "scaleEffects": {
        "small": "subtle-resonance",
        "large": "dominant-pressure",
    },
    "categories": {
        "directional": "flow",
        "containment": "boundary-memory",
        "resonance": "pressure-density",
        "fracture": "instability",
        "recursive": "loop-layering",
    },
    "contextualFactors": [
        "adjacency",
        "orientation",
        "layering",
        "repetition",
        "environment",
    ],
}


def relative_path(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def is_candidate(root: Path, path: Path, content: str) -> bool:
    relative = path.relative_to(root)
    return (
        not any(part in EXCLUDED_DIRECTORIES for part in relative.parts)
        and (GLYPH_NAME_PATTERN.search(path.name) is not None or GLYPH_HEADING_PATTERN.search(content) is not None)
    )


def note_title(content: str, fallback: str) -> str:
    title_match = TITLE_PATTERN.search(content)
    if title_match:
        return title_match.group(1).strip()
    heading_match = HEADING_PATTERN.search(content)
    if heading_match:
        return heading_match.group(1).strip()
    return fallback


def record_kind(relative: str, title: str) -> str:
    normalized_title = title.casefold()
    parts = Path(relative).parts
    if normalized_title == "glyphs":
        return "catalog"
    if "glyph archive" in normalized_title:
        return "archive"
    if "glyph map" in normalized_title:
        return "map"
    if parts and parts[0] == "_publish":
        return "archive-reference"
    return "glyph"


def primitive_fields() -> dict[str, Any]:
    return {
        "category": None,
        "strokes": [],
        "orientation": None,
        "spacing": None,
        "scale": None,
        "layers": [],
        "context": [],
        "repetition": None,
    }


def content_hash(content: str) -> str:
    normalized = FRONTMATTER_PATTERN.sub("", content).strip().replace("\r\n", "\n")
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def build_glyph_corpus(vault_root: Path) -> dict[str, Any]:
    records: list[dict[str, Any]] = []
    seen_content: set[str] = set()

    for path in sorted(vault_root.rglob("*.md"), key=lambda item: relative_path(vault_root, item).casefold()):
        if not path.is_file():
            continue
        content = path.read_text(encoding="utf-8-sig")
        if not is_candidate(vault_root, path, content):
            continue
        digest = content_hash(content)
        if digest in seen_content:
            continue
        seen_content.add(digest)
        relative = relative_path(vault_root, path)
        title = note_title(content, path.stem)
        records.append(
            {
                "id": hashlib.sha1(relative.encode("utf-8")).hexdigest()[:12],
                "title": title,
                "sourceRelativePath": relative,
                "kind": record_kind(relative, title),
                "assetReferences": sorted(set(EMBED_PATTERN.findall(content)), key=str.casefold),
                "primitives": primitive_fields(),
            }
        )

    records.sort(key=lambda record: (record["title"].casefold(), record["sourceRelativePath"].casefold()))
    counts = {
        "records": len(records),
        "glyphs": sum(record["kind"] == "glyph" for record in records),
        "archiveReferences": sum(record["kind"] == "archive-reference" for record in records),
        "catalogs": sum(record["kind"] == "catalog" for record in records),
        "maps": sum(record["kind"] == "map" for record in records),
        "archives": sum(record["kind"] == "archive" for record in records),
    }
    return {
        "version": 1,
        "source": "canonical-vault",
        "interpretation": "inventory-only",
        "primitives": CANONICAL_PRIMITIVES,
        "counts": counts,
        "records": records,
    }


def write_glyph_corpus(paths: ThresholdPaths) -> dict[str, Any]:
    corpus = build_glyph_corpus(paths.vault_root)
    output = paths.website_root / "data" / "glyph-corpus.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(corpus, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return corpus


def main() -> int:
    paths = load_threshold_paths()
    corpus = write_glyph_corpus(paths)
    print(f"Glyph corpus built with {corpus['counts']['records']} source records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
