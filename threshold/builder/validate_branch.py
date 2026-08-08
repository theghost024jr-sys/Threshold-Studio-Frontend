from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from .build_branch import load_manifest
except ImportError:
    from build_branch import load_manifest

ROOT = Path(__file__).resolve().parent.parent


def validate_branch(branch: str, root: Path = ROOT) -> None:
    expected = load_manifest(branch, root)
    published = root / "publish" / "branches" / branch
    if not (published / "index.html").is_file() or not (published / "manifest.json").is_file():
        raise FileNotFoundError(f"Branch output is incomplete: {branch}")
    actual = json.loads((published / "manifest.json").read_text(encoding="utf-8"))
    if any(actual.get(key) != value for key, value in expected.items()):
        raise ValueError(f"Published manifest differs from branch contract: {branch}")
    if not isinstance(actual.get("sourceFiles"), int) or not isinstance(actual.get("sourceDigest"), str):
        raise ValueError(f"Published manifest lacks source provenance: {branch}")
    html = (published / "index.html").read_text(encoding="utf-8")
    if f'data-threshold-branch="{branch}"' not in html:
        raise ValueError(f"Branch shell does not activate {branch}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("branch")
    args = parser.parse_args()
    validate_branch(args.branch)
    print(f"Validated Drift branch: {args.branch}")