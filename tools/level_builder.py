import json
import os
from pathlib import Path
from typing import Dict, List, Any


def load_manifest(path: Path) -> Dict[str, Any]:
    """Load a single level manifest JSON file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_all_manifests(manifest_dir: Path) -> Dict[int, Dict[str, Any]]:
    """Load all level manifests (1.json, 2.json, 3.json, 5.json, 8.json)."""
    manifests = {}
    for file in manifest_dir.glob("*.json"):
        level = int(file.stem)
        manifests[level] = load_manifest(file)
    return manifests


def apply_level_rules(level_manifest: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Apply rarity ceilings, drift rules, and filtering logic.
    This selects which assets belong to the level.
    """
    ceiling = level_manifest["rules"]["rarity_ceiling"]
    max_assets = level_manifest["rules"]["max_assets"]

    selected = []

    for asset in level_manifest["assets"]:
        rarity = asset["rarity"]

        # rarity filter
        if rarity > ceiling:
            continue

        # tag filters (empty for now)
        tags_required = level_manifest["rules"]["tags_required"]
        tags_excluded = level_manifest["rules"]["tags_excluded"]

        if tags_required:
            if not all(tag in asset["tags"] for tag in tags_required):
                continue

        if tags_excluded:
            if any(tag in asset["tags"] for tag in tags_excluded):
                continue

        selected.append(asset)

    # enforce max_assets cap
    return selected[:max_assets]


def build_level_archive(level: int, manifests: Dict[int, Dict[str, Any]]) -> Dict[str, Any]:
    """Build the temporary vault archive for a specific level."""
    manifest = manifests[level]
    selected_assets = apply_level_rules(manifest)

    archive = {
        "level": level,
        "rules": manifest["rules"],
        "assets": selected_assets,
        "sources": manifest["sources"]
    }

    return archive


def write_archive(archive: Dict[str, Any], output_path: Path):
    """Write the temporary vault archive to disk."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(archive, f, indent=2)


def build_all_levels(manifest_dir: str, output_dir: str):
    """
    Build archives for all levels (1, 2, 3, 5, 8).
    Produces:
        output_dir/level1.json
        output_dir/level2.json
        output_dir/level3.json
        output_dir/level5.json
        output_dir/level8.json
    """
    manifest_dir = Path(manifest_dir)
    output_dir = Path(output_dir)

    manifests = load_all_manifests(manifest_dir)

    for level in manifests.keys():
        archive = build_level_archive(level, manifests)
        out_file = output_dir / f"level{level}.json"
        write_archive(archive, out_file)
        print(f"Built archive for Level {level}: {out_file}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Threshold Level Builder")
    parser.add_argument("--manifest-dir", required=True, help="Path to vault-manifest/")
    parser.add_argument("--output-dir", required=True, help="Where to write temporary archives")

    args = parser.parse_args()

    build_all_levels(args.manifest_dir, args.output_dir)

