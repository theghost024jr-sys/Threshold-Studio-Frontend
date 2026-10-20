from __future__ import annotations

import hashlib
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import TYPE_CHECKING, Any

try:
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from threshold_paths import ThresholdPaths, load_threshold_paths

if TYPE_CHECKING:
    from engine.contracts import PageRenderJob, PageRenderJobs


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
PUBLIC_AUTHORSHIP = "echoroot & theghost"
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


def build_glyph_index(glyph_root: Path, website_root: Path) -> dict[str, dict[str, dict[str, str]]]:
    output_root = website_root / "vault" / "glyphs"
    glyphs: dict[str, dict[str, str]] = {}

    for glyph_id, definition in GLYPH_DEFINITIONS.items():
        source = glyph_root / f"{glyph_id}.png"
        destination = output_root / source.name
        if source.is_file():
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
        elif not destination.is_file():
            raise FileNotFoundError(
                f"Missing glyph asset in source and compatibility output: {source}"
            )
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

    def parse_value(raw_value: str) -> Any:
        value = raw_value.strip().strip('"\'')
        if value.lower() in {"true", "false"}:
            return value.lower() == "true"
        if value.lower() in {"null", "none"}:
            return None
        if value.startswith("[") and value.endswith("]"):
            return [item.strip().strip('"\'') for item in value[1:-1].split(",") if item.strip()]
        if value.startswith("{") and value.endswith("}"):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        try:
            return int(value)
        except ValueError:
            try:
                return float(value)
            except ValueError:
                return value

    metadata: dict[str, Any] = {}
    frontmatter = lines[1:end]
    index = 0
    while index < len(frontmatter):
        line = frontmatter[index]
        if not line or line[:1].isspace() or ":" not in line:
            index += 1
            continue
        key, raw_value = line.split(":", 1)
        key = key.strip()
        if raw_value.strip():
            metadata[key] = parse_value(raw_value)
            index += 1
            continue

        nested: dict[str, Any] = {}
        nested_key = ""
        index += 1
        while index < len(frontmatter):
            nested_line = frontmatter[index]
            if not nested_line[:1].isspace():
                break
            stripped = nested_line.strip()
            if stripped.startswith("- ") and nested_key:
                values = nested.setdefault(nested_key, [])
                if isinstance(values, list):
                    values.append(parse_value(stripped[2:]))
            elif ":" in stripped:
                nested_key, nested_value = stripped.split(":", 1)
                nested_key = nested_key.strip()
                nested[nested_key] = parse_value(nested_value) if nested_value.strip() else []
            index += 1
        metadata[key] = nested
    return metadata, "\n".join(lines[end + 1 :]).strip()


def include_in_public_exports(path: Path) -> bool:
    with path.open(encoding="utf-8-sig", errors="replace") as source:
        first_line = source.readline()
        if first_line.strip() != "---":
            return True
        frontmatter = [first_line]
        for line in source:
            frontmatter.append(line)
            if line.strip() == "---":
                break
    metadata, _ = split_frontmatter("".join(frontmatter))
    return metadata.get("publish") is not False and metadata.get("draft") is not True


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
        "type": metadata.get("type"),
        "map": metadata.get("map"),
        "physics": metadata.get("physics", {}),
        "weather": metadata.get("weather", {}),
        "characters": metadata.get("characters", []),
        "connections": metadata.get("connections", []),
        "page": metadata.get("page", {}),
        "html": metadata.get("html") or metadata.get("page", {}).get("html") if isinstance(metadata.get("page"), dict) else metadata.get("html"),
        "links": links,
        "assets": resolve_public_assets(vault_root, path, links, assets_by_name, asset_output_root),
        "body": body.replace("James Romeo", PUBLIC_AUTHORSHIP),
    }


def node_record(document: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": document["id"],
        "type": document.get("type") or document["kind"],
        "map": document.get("map"),
        "physics": document.get("physics") if isinstance(document.get("physics"), dict) else {},
        "weather": document.get("weather") if isinstance(document.get("weather"), (dict, str)) else {},
        "characters": document.get("characters") if isinstance(document.get("characters"), list) else [],
        "connections": document.get("connections") if isinstance(document.get("connections"), list) else [],
        "html": document.get("html") or (document.get("page") or {}).get("html") or document.get("route"),
    }


def _mapping_path(value: Any, field: str, suffix: str) -> PurePosixPath:
    if not isinstance(value, str) or not value or "\\" in value:
        raise ValueError(f"Page mapping {field} must be a relative POSIX path")

    parts = value.split("/")
    path = PurePosixPath(value)
    if (
        path.is_absolute()
        or any(part in {"", ".", ".."} for part in parts)
        or path.suffix.casefold() != suffix
    ):
        raise ValueError(f"Page mapping {field} is not a safe {suffix} path: {value}")
    return path


def build_vault_render_jobs(
    paths: ThresholdPaths,
    published: list[dict[str, Any]],
    manifest_data: dict[str, Any] | None = None,
) -> PageRenderJobs:
    if manifest_data is None:
        manifest_data = json.loads(paths.page_mapping_path.read_text(encoding="utf-8"))
    if manifest_data.get("version") != 1 or not isinstance(manifest_data.get("pages"), list):
        raise ValueError("Page mapping manifest must have version 1 and a pages array")

    documents_by_path = {document["relativePath"]: document for document in published}
    seen_notes: set[str] = set()
    seen_outputs: set[str] = set()
    jobs: list[PageRenderJob] = []

    for mapping in manifest_data["pages"]:
        if not isinstance(mapping, dict):
            raise ValueError("Each page mapping must be an object")
        note = _mapping_path(mapping.get("note"), "note", ".md")
        template = _mapping_path(mapping.get("templateId"), "templateId", ".html")
        output = _mapping_path(mapping.get("output"), "output", ".html")

        if note.parts[0] != "_publish":
            raise ValueError(f"Mapped note must be under _publish: {note.as_posix()}")
        if note.stem != template.stem or note.stem != output.stem:
            raise ValueError(
                "Mapped Markdown, template, and output must have the exact same filename stem"
            )
        if note.as_posix() in seen_notes:
            raise ValueError(f"Duplicate Markdown page mapping: {note.as_posix()}")
        if output.as_posix().casefold() in seen_outputs:
            raise ValueError(f"Duplicate generated page output: {output.as_posix()}")
        seen_notes.add(note.as_posix())
        seen_outputs.add(output.as_posix().casefold())

        document = documents_by_path.get(note.as_posix())
        if document is None:
            raise ValueError(f"Mapped note is not an eligible published Markdown file: {note.as_posix()}")

        template_path = paths.page_templates_root.joinpath(*template.parts)
        if not template_path.is_file():
            raise FileNotFoundError(f"Mapped HTML template is missing: {template_path}")
        if not template_path.resolve().is_relative_to(paths.page_templates_root.resolve()):
            raise ValueError(f"Mapped HTML template escapes its directory: {template.as_posix()}")

        template_text = template_path.read_text(encoding="utf-8-sig")
        begin_marker = "<!-- BEGIN_CONTENT -->"
        end_marker = "<!-- END_CONTENT -->"
        if (
            template_text.count(begin_marker) != 1
            or template_text.count(end_marker) != 1
            or template_text.index(begin_marker) >= template_text.index(end_marker)
        ):
            raise ValueError(f"Template must contain one ordered content marker pair: {template.as_posix()}")

        resolved_assets = document["assets"]
        if not isinstance(resolved_assets, list):
            raise ValueError(f"Mapped note has an invalid resolved-assets collection: {note.as_posix()}")
        resolved_names = {
            asset["name"].casefold()
            for asset in resolved_assets
            if isinstance(asset, dict) and isinstance(asset.get("name"), str)
        }
        for asset in resolved_assets:
            if not isinstance(asset, dict) or not all(
                isinstance(asset.get(key), str)
                for key in ("name", "sourceRelativePath", "webPath")
            ):
                raise ValueError(f"Mapped note contains an invalid asset record: {note.as_posix()}")
            web_path = asset["webPath"]
            if not web_path.startswith("/assets/vault/"):
                raise ValueError(f"Mapped note contains a non-vault public asset URL: {web_path}")
            asset_relative_value = web_path.lstrip("/")
            asset_suffix = PurePosixPath(asset_relative_value).suffix.casefold()
            if asset_suffix not in PUBLIC_MEDIA_EXTENSIONS:
                raise ValueError(f"Mapped note contains an unsupported public asset URL: {web_path}")
            asset_relative = _mapping_path(asset_relative_value, "asset webPath", asset_suffix)
            asset_path = paths.website_root.joinpath(*asset_relative.parts)
            if not asset_path.resolve().is_relative_to(paths.website_root.resolve()):
                raise ValueError(f"Resolved asset escapes websiteRoot: {web_path}")
            if not asset_path.is_file():
                raise FileNotFoundError(f"Resolved public asset is missing: {web_path}")
        for link in document.get("links", []):
            asset_name = Path(link.strip()).name
            if (
                Path(asset_name).suffix.casefold() in PUBLIC_MEDIA_EXTENSIONS
                and asset_name.casefold() not in resolved_names
            ):
                raise FileNotFoundError(
                    f"Mapped note references an unresolved public asset: {note.as_posix()} -> {asset_name}"
                )

        job: PageRenderJob = {
            "noteId": document["id"],
            "relativePath": note.as_posix(),
            "templateId": template.as_posix(),
            "outputPath": output.as_posix(),
            "markdownBody": document["body"],
            "resolvedAssets": resolved_assets,
            "status": "valid",
        }
        jobs.append(job)

    return {"version": 1, "jobs": jobs}


def build_vault_data(paths: ThresholdPaths) -> dict[str, Any]:
    vault_files = markdown_files(paths.vault_root)
    publish_root = paths.vault_root / "_publish"
    if not publish_root.is_dir():
        raise FileNotFoundError(f"Canonical publish surface not found: {publish_root}")

    asset_output_root = paths.website_root / "assets" / "vault"
    assets_by_name = media_index(paths.vault_root)
    build_species_signals(paths.vault_root, assets_by_name, paths.website_root)
    build_glyph_index(paths.glyph_root, paths.website_root)
    published = [
        public_document(paths.vault_root, path, assets_by_name, asset_output_root)
        for path in markdown_files(publish_root)
        if include_in_public_exports(path)
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
        if include_in_public_exports(path)
    ]
    generated_at = datetime.now(timezone.utc).isoformat()
    payload = {
        "version": 1,
        "generatedAt": generated_at,
        "authorship": PUBLIC_AUTHORSHIP,
        "counts": {
            "markdown": len(indexed),
            "publishedMarkdown": len(published),
            "entities": sum(document["kind"] == "entity" for document in published),
            "chambers": sum(document["kind"] == "chamber" for document in published),
            "translations": len(translations),
        },
        "documents": published,
        "nodes": [node_record(document) for document in published],
        "entities": [document for document in published if document["kind"] == "entity"],
        "chambers": [document for document in published if document["kind"] == "chamber"],
        "translations": translations,
    }
    index = {
        "version": 1,
        "generatedAt": generated_at,
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
                "authorship": payload["authorship"],
                "dataPath": "/data/threshold-vault.json",
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
    print(f"Vault data built for {payload['authorship']} authorship")
    print(f"Published {payload['counts']['publishedMarkdown']} notes to {paths.website_root / 'data'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())