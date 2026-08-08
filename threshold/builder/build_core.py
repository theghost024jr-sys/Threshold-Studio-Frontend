from __future__ import annotations

from pathlib import Path

try:
    from .utils.file_ops import copy_tree
except ImportError:
    from utils.file_ops import copy_tree

ROOT = Path(__file__).resolve().parent.parent


def build_core(root: Path = ROOT) -> list[Path]:
    return copy_tree(root / "core", root / "publish" / "core")


if __name__ == "__main__":
    files = build_core()
    print(f"Published Anchor core: {len(files)} files")