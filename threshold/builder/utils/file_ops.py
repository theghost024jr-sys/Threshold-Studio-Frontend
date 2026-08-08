from __future__ import annotations

import hashlib
import shutil
from pathlib import Path


def ensure_within(root: Path, path: Path) -> Path:
    resolved_root = root.resolve()
    resolved_path = path.resolve()
    if not resolved_path.is_relative_to(resolved_root):
        raise ValueError(f"Path escapes {resolved_root}: {path}")
    return resolved_path


def copy_tree(source: Path, destination: Path, excluded_names: frozenset[str] = frozenset({".gitkeep"})) -> list[Path]:
    source = source.resolve()
    destination = destination.resolve()
    if not source.is_dir():
        raise FileNotFoundError(f"Source directory not found: {source}")
    if destination == source or destination.is_relative_to(source):
        raise ValueError("Destination must be outside the source directory")

    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)

    copied: list[Path] = []
    for path in sorted(source.rglob("*")):
        if path.is_symlink():
            raise ValueError(f"Symlinks are not publishable: {path}")
        if not path.is_file() or path.name in excluded_names:
            continue
        relative = path.relative_to(source)
        target = ensure_within(destination, destination / relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
        copied.append(relative)
    return copied


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()