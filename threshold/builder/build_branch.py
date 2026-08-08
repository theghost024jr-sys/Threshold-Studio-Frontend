from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path

try:
    from .utils.file_ops import copy_tree, sha256_file
except ImportError:
    from utils.file_ops import copy_tree, sha256_file

ROOT = Path(__file__).resolve().parent.parent


def load_manifest(branch: str, root: Path = ROOT) -> dict[str, object]:
    if not branch or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789-" for character in branch):
        raise ValueError(f"Invalid branch: {branch}")
    path = root / "branches" / branch / "manifest.json"
    if not path.is_file():
        raise FileNotFoundError(f"Unknown branch: {branch}")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if manifest.get("id") != branch:
        raise ValueError(f"Manifest ID does not match branch: {branch}")
    return manifest


def build_branch(branch: str, root: Path = ROOT) -> list[Path]:
    manifest = load_manifest(branch, root)
    source = root / "branches" / branch / "src"
    source_files = sorted(
        path for path in source.rglob("*")
        if path.is_file() and path.name != ".gitkeep"
    ) if source.is_dir() else []
    source_digest = hashlib.sha256()
    for path in source_files:
        source_digest.update(path.relative_to(source).as_posix().encode("utf-8"))
        source_digest.update(sha256_file(path).encode("ascii"))
    publication_manifest = {
        **manifest,
        "sourceFiles": len(source_files),
        "sourceDigest": source_digest.hexdigest(),
    }
    build = root / "branches" / branch / "build"
    build.mkdir(parents=True, exist_ok=True)
    for path in build.iterdir():
        if path.name != ".gitkeep" and path.is_file():
            path.unlink()

    label = html.escape(str(manifest.get("label", branch)))
    activation = html.escape(str(manifest.get("activation", branch)))
    page = (
        "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
        f"<title>{label} - Threshold</title><link rel=\"stylesheet\" href=\"../../core/css/core.css\"></head>"
        f"<body data-threshold-branch=\"{activation}\"><main data-environment></main>"
        "<script src=\"../../core/js/nav.js\"></script><script src=\"../../core/js/environment.js\"></script>"
        "<script src=\"../../core/js/chamber-loader.js\"></script></body></html>\n"
    )
    (build / "index.html").write_text(page, encoding="utf-8")
    (build / "manifest.json").write_text(json.dumps(publication_manifest, indent=2) + "\n", encoding="utf-8")
    return copy_tree(build, root / "publish" / "branches" / branch)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("branch")
    args = parser.parse_args()
    files = build_branch(args.branch)
    print(f"Published Drift branch {args.branch}: {len(files)} files")