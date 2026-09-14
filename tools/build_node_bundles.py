from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from threshold_paths import ThresholdPaths, load_threshold_paths


BUNDLE_TERMS = {
    "anchor-validation": ("anchor",),
    "collapse": ("collapse",),
    "drift": ("drift",),
    "resonance": ("resonance",),
    "pressure": ("pressure",),
    "appearance": ("appearance", "visual", "glyph"),
}


def matches(document: dict[str, Any], terms: tuple[str, ...]) -> bool:
    searchable = " ".join(
        str(document.get(key, ""))
        for key in ("title", "relativePath", "category", "description", "body")
    ).casefold()
    return any(term in searchable for term in terms)


def write_bundle(root: Path, name: str, payload: dict[str, Any]) -> dict[str, Any]:
    target = root / name / "bundle.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    target.write_text(encoded, encoding="utf-8")
    return {"name": name, "path": target.relative_to(root).as_posix(), "bytes": len(encoded.encode("utf-8"))}


def build_node_bundles(paths: ThresholdPaths) -> dict[str, Any]:
    source_path = paths.website_root / "data" / "threshold-vault.json"
    if not source_path.is_file():
        raise FileNotFoundError(f"Build vault data first: {source_path}")

    source = json.loads(source_path.read_text(encoding="utf-8"))
    source_vault = str(source.get("vaultRoot", paths.vault_root))
    documents = source["documents"]
    generated_at = datetime.now(timezone.utc).isoformat()
    records = []
    for name, terms in BUNDLE_TERMS.items():
        selected = [document for document in documents if matches(document, terms)]
        records.append(write_bundle(paths.node_bundles_root, name, {
            "version": 1,
            "generatedAt": generated_at,
            "sourceVault": source_vault,
            "name": name,
            "count": len(selected),
            "documents": selected,
        }))

    records.append(write_bundle(paths.node_bundles_root, "workspace", {
        "version": 1,
        "generatedAt": generated_at,
        "sourceVault": source_vault,
        "counts": source["counts"],
    }))
    records.append(write_bundle(paths.node_bundles_root, "graph", {
        "version": 1,
        "generatedAt": generated_at,
        "sourceVault": source_vault,
        "nodes": [
            {
                "id": document["id"],
                "title": document["title"],
                "relativePath": document["relativePath"],
                "links": document["links"],
            }
            for document in documents
        ],
    }))
    records.append(write_bundle(paths.node_bundles_root, "node-metadata", {
        "version": 1,
        "generatedAt": generated_at,
        "sourceVault": source_vault,
        "nodes": [
            {key: value for key, value in document.items() if key != "body"}
            for document in documents
        ],
    }))
    manifest = {
        "version": 1,
        "generatedAt": generated_at,
        "sourceVault": source_vault,
        "bundles": records,
    }
    paths.node_bundles_root.mkdir(parents=True, exist_ok=True)
    (paths.node_bundles_root / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def main() -> int:
    ci = os.environ.get("CI", "").strip().lower() not in {"", "0", "false", "no"}
    root = Path(__file__).resolve().parent.parent
    fallback_data = root / "website" / "data" / "threshold-vault.json"
    fallback_notice: str | None = None
    try:
        paths = load_threshold_paths()
        manifest = build_node_bundles(paths)
    except FileNotFoundError as error:
        if ci and fallback_data.is_file():
            snapshot = json.loads(fallback_data.read_text(encoding="utf-8"))
            if not isinstance(snapshot, dict) or not isinstance(snapshot.get("documents"), list):
                raise ValueError(f"Committed vault snapshot is invalid: {fallback_data}")
            paths = ThresholdPaths(
                vault_root=root,
                glyph_root=root / "vault" / "glyphs",
                system_root=root,
                website_root=root / "website",
                html_inventory_root=root / "html-inventory",
                world_root=root / "world",
                threshold_root=root,
                node_bundles_root=root / "node-bundles",
                scripts_root=root / "scripts",
                tools_root=root / "tools",
            )
            manifest = build_node_bundles(paths)
            fallback_notice = f"Rebuilt node bundles from committed vault snapshot in CI: {error}"
        else:
            raise
    if fallback_notice:
        print(fallback_notice)
    print(f"Built {len(manifest['bundles'])} node bundles from {manifest['sourceVault']}")
    print(f"Node bundles: {paths.node_bundles_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())