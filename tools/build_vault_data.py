from __future__ import annotations

import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from threshold_paths import ThresholdPaths, load_threshold_paths


IGNORED_PARTS = {
    ".git",
    ".obsidian",
    ".trash",
    "node_modules",
    "Scripts",
    "dist",
    "_private",
}
WIKILINK_PATTERN = re.compile(r"\[\[([^\]|#]+)")
PUBLIC_MEDIA_EXTENSIONS = {
    ".avif",
    ".gif",
    ".jpeg",
    ".jpg",
    ".mp3",
    ".mp4",
    ".ogg",
    ".png",
    ".svg",
    ".webm",
    ".webp",
    ".wav",
}
SPECIES_SIGNAL_FILES = {
    "cindervox": {
        "default": ("cindervox.png", "cindervox.png"),
        "passive": ("cindervoxpassive.png", "cindervoxpassive.png"),
        "signal": ("cindervoxx.png", "cindervoxx.png"),
    },
    "porpoise": {
        "default": ("porpois.png", "porpoise.png"),
    },
}
GLYPH_DEFINITIONS = {
    "collapse": {
        "name": "Collapse",
        "text": "Collapse is the breaking of structure, the descent into pressure.",
    },
    "expand": {
        "name": "Expand",
        "text": "Expand is the release of pressure, the widening of possibility.",
    },
    "fog": {
        "name": "Fog",
        "text": "Fog is uncertainty, drift, and the softening of boundaries.",
    },
    "soil": {
        "name": "Soil",
        "text": "Soil is memory, compost, and the foundation of growth.",
    },
}


def relative_path(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def is_visible(path: Path, root: Path) -> bool:
    return not any(part in IGNORED_PARTS for part in path.relative_to(root).parts)


def markdown_files(root: Path) -> list[Path]:
    return sorted(
        (path for path in root.rglob("*.md") if path.is_file() and is_visible(path, root)),
        key=lambda path: relative_path(root, path).casefold(),
    )


def media_index(root: Path) -> dict[str, list[Path]]:
    index: dict[str, list[Path]] = {}
    for path in root.rglob("*"):
        if not path.is_file() or not is_visible(path, root):
            continue
        if path.suffix.casefold() not in PUBLIC_MEDIA_EXTENSIONS:
            continue
        index.setdefault(path.name.casefold(), []).append(path)
    return index


def resolve_public_assets(
    vault_root: Path,
    note_path: Path,
    links: list[str],
    assets_by_name: dict[str, list[Path]],
    output_root: Path,
) -> list[dict[str, str]]:
    assets: list[dict[str, str]] = []
    seen: set[Path] = set()
    preferred_root = vault_root / "_publish" / "assets"

    for link in links:
        link_name = Path(link.strip()).name
        if Path(link_name).suffix.casefold() not in PUBLIC_MEDIA_EXTENSIONS:
            continue
        candidates = assets_by_name.get(link_name.casefold(), [])
        if not candidates:
            continue
        source = min(
            candidates,
            key=lambda candidate: (
                0 if candidate.parent == note_path.parent else 1,
                0 if candidate.is_relative_to(preferred_root) else 1,
                0 if candidate.is_relative_to(vault_root / "_publish") else 1,
                len(candidate.parts),
                str(candidate).casefold(),
            ),
        )
        if source in seen:
            continue
        seen.add(source)

        source_relative = relative_path(vault_root, source)
        public_name = hashlib.sha1(source_relative.encode("utf-8")).hexdigest()[:12] + source.suffix.casefold()
        destination = output_root / public_name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        assets.append(
            {
                "name": source.name,
                "sourceRelativePath": source_relative,
                "webPath": f"/assets/vault/{public_name}",
            }
        )

    return assets


def publish_declared_asset(
    vault_root: Path,
    declared_asset: Any,
    assets_by_name: dict[str, list[Path]],
    website_root: Path,
) -> None:
    if not isinstance(declared_asset, str) or not declared_asset.startswith("/"):
        return
    asset_path = Path(declared_asset.lstrip("/"))
    destination = (website_root / asset_path).resolve()
    if not destination.is_relative_to(website_root.resolve()):
        raise ValueError(f"Public asset path escapes website root: {declared_asset}")
    candidates = assets_by_name.get(asset_path.name.casefold(), [])
    if not candidates:
        raise FileNotFoundError(f"Declared public asset not found in canonical vault: {declared_asset}")
    preferred_root = vault_root / "_publish" / "assets"
    source = min(
        candidates,
        key=lambda candidate: (
            0 if candidate.is_relative_to(preferred_root) else 1,
            len(candidate.parts),
            str(candidate).casefold(),
        ),
    )
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def build_species_signals(
    vault_root: Path,
    assets_by_name: dict[str, list[Path]],
    website_root: Path,
) -> dict[str, dict[str, str]]:
    output_root = website_root / "vault" / "assets"
    signals: dict[str, dict[str, str]] = {}

    for species, intents in SPECIES_SIGNAL_FILES.items():
        species_signals: dict[str, str] = {}
        for intent, filenames in intents.items():
            source_filename, public_filename = filenames
            candidates = assets_by_name.get(source_filename.casefold(), [])
            if not candidates:
                raise FileNotFoundError(f"Missing {species} {intent} asset in canonical vault: {source_filename}")
            source = min(
                candidates,
                key=lambda candidate: (
                    0 if "_publish_candidates/required/assets" in relative_path(vault_root, candidate).casefold() else 1,
                    len(candidate.parts),
                    str(candidate).casefold(),
                ),
            )
            destination = output_root / public_filename.casefold()
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
            species_signals[intent] = f"/vault/assets/{destination.name}"
        signals[species] = species_signals

    (website_root / "species-signals.json").write_text(
        json.dumps(signals, indent=2) + "\n",
        encoding="utf-8",
    )
    return signals


def build_glyph_index(vault_root: Path, website_root: Path) -> dict[str, dict[str, dict[str, str]]]:
    source_root = vault_root / "glyphs"
    output_root = website_root / "vault" / "glyphs"
    glyphs: dict[str, dict[str, str]] = {}

    for glyph_id, definition in GLYPH_DEFINITIONS.items():
        source = source_root / f"{glyph_id}.png"
        if not source.is_file():
            raise FileNotFoundError(f"Missing canonical glyph asset: {source}")
        destination = output_root / source.name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
        glyphs[glyph_id] = {
            "id": glyph_id,
            "name": definition["name"],
            "asset": f"/vault/glyphs/{source.name}",
            "text": definition["text"],
        }

    payload = {"glyphs": glyphs}
    config_root = website_root / "config"
    config_root.mkdir(parents=True, exist_ok=True)
    (config_root / "glyphs.json").write_text(
        json.dumps(payload, indent=2) + "\n",
        encoding="utf-8",
    )
    return payload


def split_frontmatter(source: str) -> tuple[dict[str, Any], str]:
    lines = source.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, source

    try:
        end = next(index for index, line in enumerate(lines[1:], 1) if line.strip() == "---")
    except StopIteration:
        return {}, source

    metadata: dict[str, Any] = {}
    for line in lines[1:end]:
        if not line or line[:1].isspace() or ":" not in line:
            continue
        key, raw_value = line.split(":", 1)
        value = raw_value.strip().strip('"\'')
        if value.lower() in {"true", "false"}:
            metadata[key.strip()] = value.lower() == "true"
        elif value.startswith("[") and value.endswith("]"):
            metadata[key.strip()] = [item.strip().strip('"\'') for item in value[1:-1].split(",") if item.strip()]
        else:
            metadata[key.strip()] = value
    return metadata, "\n".join(lines[end + 1 :]).strip()


def document_kind(relative: str, metadata: dict[str, Any]) -> str:
    normalized = relative.casefold()
    category = str(metadata.get("category", "")).casefold()
    if "chamber" in normalized or category == "chamber":
        return "chamber"
    if any(token in normalized for token in ("/actors/", "/species/", " entity")):
        return "entity"
    return "note"


def public_document(
    vault_root: Path,
    path: Path,
    assets_by_name: dict[str, list[Path]],
    asset_output_root: Path,
) -> dict[str, Any]:
    source = path.read_text(encoding="utf-8-sig", errors="replace")
    metadata, body = split_frontmatter(source)
    relative = relative_path(vault_root, path)
    title = str(metadata.get("title") or path.stem)
    document_id = str(metadata.get("id") or hashlib.sha1(relative.encode("utf-8")).hexdigest()[:12])
    links = sorted(set(WIKILINK_PATTERN.findall(body)), key=str.casefold)
    publish_declared_asset(vault_root, metadata.get("asset"), assets_by_name, asset_output_root.parents[1])
    return {
        "id": document_id,
        "title": title,
        "relativePath": relative,
        "kind": document_kind(relative, metadata),
        "category": metadata.get("category"),
        "chamber": metadata.get("chamber"),
        "route": metadata.get("route"),
        "entries": metadata.get("entries", []) if isinstance(metadata.get("entries", []), list) else [],
        "exits": metadata.get("exits", []) if isinstance(metadata.get("exits", []), list) else [],
        "neighbors": metadata.get("neighbors", []) if isinstance(metadata.get("neighbors", []), list) else [],
        "asset": metadata.get("asset"),
        "publish": metadata.get("publish"),
        "draft": metadata.get("draft"),
        "tags": metadata.get("tags", []) if isinstance(metadata.get("tags", []), list) else [],
        "description": metadata.get("description", ""),
        "links": links,
        "assets": resolve_public_assets(vault_root, path, links, assets_by_name, asset_output_root),
        "body": body,
    }


def build_vault_data(paths: ThresholdPaths) -> dict[str, Any]:
    vault_files = markdown_files(paths.vault_root)
    publish_root = paths.vault_root / "_publish"
    if not publish_root.is_dir():
        raise FileNotFoundError(f"Canonical publish surface not found: {publish_root}")

    asset_output_root = paths.website_root / "assets" / "vault"
    assets_by_name = media_index(paths.vault_root)
    build_species_signals(paths.vault_root, assets_by_name, paths.website_root)
    build_glyph_index(paths.vault_root, paths.website_root)
    published = [
        public_document(paths.vault_root, path, assets_by_name, asset_output_root)
        for path in markdown_files(publish_root)
    ]
    translations = sorted(
        relative_path(paths.vault_root, path)
        for path in paths.vault_root.rglob("*.translation")
        if path.is_file() and is_visible(path, paths.vault_root)
    )
    indexed = [
        {
            "id": hashlib.sha1(relative_path(paths.vault_root, path).encode("utf-8")).hexdigest()[:12],
            "title": path.stem,
            "relativePath": relative_path(paths.vault_root, path),
        }
        for path in vault_files
    ]
    generated_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "version": 1,
        "generatedAt": generated_at,
        "vaultRoot": str(paths.vault_root),
        "publishRoot": str(publish_root),
        "counts": {
            "markdown": len(indexed),
            "publishedMarkdown": len(published),
            "entities": sum(document["kind"] == "entity" for document in published),
            "chambers": sum(document["kind"] == "chamber" for document in published),
            "translations": len(translations),
        },
        "documents": published,
        "entities": [document for document in published if document["kind"] == "entity"],
        "chambers": [document for document in published if document["kind"] == "chamber"],
        "translations": translations,
    }
    index = {
        "version": 1,
        "generatedAt": generated_at,
        "vaultRoot": str(paths.vault_root),
        "count": len(indexed),
        "documents": indexed,
    }

    data_root = paths.website_root / "data"
    data_root.mkdir(parents=True, exist_ok=True)
    (data_root / "threshold-vault.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (data_root / "vault-index.json").write_text(
        json.dumps(index, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (paths.world_root / "vault-source.json").write_text(
        json.dumps(
            {
                "version": 1,
                "generatedAt": generated_at,
                "vaultPath": str(paths.vault_root),
                "dataPath": str(data_root / "threshold-vault.json"),
                "counts": payload["counts"],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return payload


def main() -> int:
    paths = load_threshold_paths()
    payload = build_vault_data(paths)
    print(f"Vault data built from {payload['vaultRoot']}")
    print(f"Published {payload['counts']['publishedMarkdown']} notes to {paths.website_root / 'data'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())