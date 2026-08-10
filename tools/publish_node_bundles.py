#!/usr/bin/env python3
"""Build activation-scoped node bundles from the exported Obsidian vault archive."""

from __future__ import annotations

import argparse
import copy
import hashlib
import hmac
import json
import os
import shutil
from pathlib import Path, PurePosixPath
from typing import Any

PUBLIC_SPOKES = (
    "house-garden",
    "learning-wheel",
    "ethos",
    "discover",
    "invitation",
    "mythology",
    "glyphs",
    "contact",
    "engine",
)
MAX_OBJECT_BYTES = 95_000_000


def activation_token(secret: str, *parts: str) -> str:
    message = ":".join(parts).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()[:32]


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def resolve_asset_path(asset_root: Path, asset: dict[str, Any]) -> Path:
    raw_path = str(asset.get("sourcePath") or asset.get("webPath") or "").replace("\\", "/")
    relative = PurePosixPath(raw_path)
    if not raw_path or relative.is_absolute() or ".." in relative.parts or ":" in raw_path:
        raise ValueError(f"Unsafe activated asset path: {raw_path}")

    asset_root = asset_root.resolve()
    candidates = [asset_root.joinpath(*relative.parts)]
    web_prefix = PurePosixPath("website/assets/vault")
    if relative.parts[:len(web_prefix.parts)] == web_prefix.parts:
        candidates.insert(0, asset_root.joinpath(*relative.parts[len(web_prefix.parts):]))
    candidates.append(asset_root / relative.name)
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.is_relative_to(asset_root) and resolved.is_file():
            return resolved
    raise FileNotFoundError(f"Missing activated asset: {candidates[0]}")


def write_bundle(output: Path, spoke: str, token: str, payload: dict[str, Any]) -> dict[str, Any]:
    path = output / "nodes" / spoke / f"{token}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    path.write_bytes(encoded)
    repository = payload["repository"]
    repository_path = output / "repositories" / repository / "nodes" / spoke / path.name
    repository_path.parent.mkdir(parents=True, exist_ok=True)
    repository_path.write_bytes(encoded)
    return {
        "type": "bundle",
        "key": path.relative_to(output).as_posix(),
        "repository": repository,
        "sha256": hashlib.sha256(encoded).hexdigest(),
        "bytes": len(encoded),
    }


def package_assets(
    value: Any,
    asset_root: Path,
    output: Path,
    repository: str,
    spoke: str,
    token: str,
) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    seen: set[str] = set()

    def visit(item: Any) -> None:
        if isinstance(item, list):
            for child in item:
                visit(child)
            return
        if not isinstance(item, dict):
            return

        if "webPath" in item and ("sourcePath" in item or "extension" in item):
            source_path = resolve_asset_path(asset_root, item)
            size = source_path.stat().st_size
            if size > MAX_OBJECT_BYTES:
                raise ValueError(f"Activated asset exceeds {MAX_OBJECT_BYTES} bytes: {source_path}")
            digest = file_sha256(source_path)
            object_name = f"{digest[:16]}-{source_path.name}"
            relative = Path("assets") / spoke / token / object_name
            item["webPath"] = f"/api/nodes/assets/{spoke}/{token}/{object_name}"
            if object_name not in seen:
                    canonical_path = output / relative
                    repository_path = output / "repositories" / repository / relative
                    canonical_path.parent.mkdir(parents=True, exist_ok=True)
                    repository_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(source_path, canonical_path)
                    shutil.copy2(source_path, repository_path)
                    records.append({
                        "type": "asset",
                        "key": relative.as_posix(),
                        "repository": repository,
                        "sha256": digest,
                        "bytes": size,
                    })
                    seen.add(object_name)

        for child in item.values():
            visit(child)

    visit(value)
    return records


def resolve_source(archive: dict[str, Any], source: str) -> Any:
    value: Any = archive
    for part in source.split("."):
        if not isinstance(value, dict) or part not in value:
            raise KeyError(f"topology source does not exist: {source}")
        value = value[part]
    return value


def node_fib(node: dict[str, Any], parent: str) -> int:
    return node.get("fibByParent", {}).get(parent, node["fib"])


def child_node(secret: str, spoke: str, parent: str, node_id: str, node: dict[str, Any]) -> dict[str, Any]:
    child = {
        "id": node_id,
        "label": node.get("label", node_id.replace("-", " ").title()),
        "fib": node_fib(node, parent),
        "activation": activation_token(secret, spoke, parent, node_id),
    }
    if "card" in node:
        child["card"] = copy.deepcopy(node["card"])
    return child


def parent_node(spoke: str, parent_id: str, template: dict[str, Any], nodes: dict[str, Any]) -> dict[str, Any]:
    if parent_id == spoke:
        return {"id": spoke, "label": spoke.replace("-", " ").title(), "fib": template["fib"]}
    parent = nodes[parent_id]
    return {
        "id": parent_id,
        "label": parent.get("label", parent_id.replace("-", " ").title()),
        "fib": parent["fib"],
    }


def spoke_template(topology: dict[str, Any], spoke: str) -> dict[str, Any]:
    return topology.get("spokes", {}).get(spoke, topology["spokeTemplate"])


def validate_topology(topology: dict[str, Any]) -> None:
    fibs = topology.get("fibs")
    nodes = topology.get("nodes")
    template = topology.get("spokeTemplate")
    if not isinstance(fibs, list) or 1 not in fibs or 2 not in fibs or len(fibs) != len(set(fibs)):
        raise ValueError("topology must declare unique Fibs including Fib 1 and Fib 2")
    if not isinstance(nodes, dict) or not isinstance(template, dict):
        raise ValueError("topology requires nodes and a spokeTemplate")
    spokes = topology.get("spokes", {})
    if not isinstance(spokes, dict):
        raise ValueError("topology spokes must be an object")

    allowed_fibs = set(fibs)
    for node_id, node in nodes.items():
        if node.get("fib") not in allowed_fibs:
            raise ValueError(f"{node_id} uses an undeclared Fib")
        if not isinstance(node.get("components", []), list):
            raise ValueError(f"{node_id} components must be a list")
        if "card" in node and not isinstance(node["card"], dict):
            raise ValueError(f"{node_id} card must be an object")
        for child_id in node.get("children", []):
            if child_id not in nodes:
                raise ValueError(f"{node_id} references unknown child {child_id}")
            if node_fib(nodes[child_id], node_id) >= node["fib"]:
                raise ValueError(f"{child_id} must move inward from {node_id}")

    templates = [("spoke template", template), *[(f"{spoke} spoke", value) for spoke, value in spokes.items()]]
    for label, spoke_definition in templates:
        if not isinstance(spoke_definition, dict):
            raise ValueError(f"{label} must be an object")
        if spoke_definition.get("fib") not in allowed_fibs:
            raise ValueError(f"{label} uses an undeclared Fib")
        for child_id in spoke_definition.get("children", []):
            if child_id not in nodes:
                raise ValueError(f"{label} references unknown child {child_id}")
            if node_fib(nodes[child_id], spoke_definition.get("id", label.removesuffix(" spoke"))) >= spoke_definition["fib"]:
                raise ValueError(f"{child_id} must move inward from {label}")


def build_bundles(
    archive_path: Path,
    topology_path: Path,
    asset_root: Path,
    output: Path,
    secret: str,
    branches: tuple[str, ...] = PUBLIC_SPOKES,
) -> dict[str, Any]:
    source = json.loads(archive_path.read_text(encoding="utf-8-sig"))
    archive = source.get("archive", {})
    topology = json.loads(topology_path.read_text(encoding="utf-8"))
    validate_topology(topology)
    nodes = topology["nodes"]

    records: list[dict[str, Any]] = []
    unknown_branches = sorted(set(branches) - set(PUBLIC_SPOKES))
    if unknown_branches:
        raise ValueError(f"Unknown branch: {', '.join(unknown_branches)}")
    if not branches:
        raise ValueError("At least one branch is required")

    for spoke in branches:
        template = spoke_template(topology, spoke)
        root_repository = f"threshold-fib-2-{spoke}"
        root_children = [
            child_node(secret, spoke, spoke, child_id, nodes[child_id])
            for child_id in template.get("children", [])
        ]
        records.extend(package_assets(
            root_children,
            asset_root,
            output,
            root_repository,
            spoke,
            spoke,
        ))
        records.append(write_bundle(output, spoke, spoke, {
            "id": spoke,
            "spoke": spoke,
            "fib": template["fib"],
            "kind": "spoke",
            "repository": root_repository,
            "components": [],
            "children": root_children,
        }))

        pending = [(spoke, node_id) for node_id in template.get("children", [])]
        while pending:
            parent_id, node_id = pending.pop(0)
            node = nodes[node_id]
            token = activation_token(secret, spoke, parent_id, node_id)
            components = [
                {
                    "type": component["type"],
                    "content": copy.deepcopy(resolve_source(archive, component["source"])),
                }
                for component in node.get("components", [])
            ]
            children = [
                child_node(secret, spoke, node_id, child_id, nodes[child_id])
                for child_id in node.get("children", [])
            ]
            asset_records = package_assets(
                {"components": components, "content": node.get("content"), "children": children},
                asset_root,
                output,
                node["repository"],
                spoke,
                token,
            )
            records.append(write_bundle(output, spoke, token, {
                "id": node_id,
                "spoke": spoke,
                "fib": node_fib(node, parent_id),
                "kind": node.get("kind", "hybrid"),
                "repository": node["repository"],
                "parent": parent_node(spoke, parent_id, template, nodes),
                "components": components,
                "content": copy.deepcopy(node.get("content")),
                "children": children,
            }))
            records.extend(asset_records)
            pending.extend((node_id, child_id) for child_id in node.get("children", []))

    manifest = {
        "version": 1,
        "source": archive_path.name,
        "topology": topology_path.name,
        "branches": list(branches),
        "bundleCount": sum(record["type"] == "bundle" for record in records),
        "assetCount": sum(record["type"] == "asset" for record in records),
        "totalBytes": sum(record["bytes"] for record in records),
        "objects": records,
    }
    for repository in sorted({record["repository"] for record in records}):
        repository_records = [record for record in records if record["repository"] == repository]
        repository_manifest = {
            "version": 1,
            "repository": repository,
            "bundleCount": sum(record["type"] == "bundle" for record in repository_records),
            "assetCount": sum(record["type"] == "asset" for record in repository_records),
            "totalBytes": sum(record["bytes"] for record in repository_records),
            "objects": repository_records,
        }
        repository_root = output / "repositories" / repository
        (repository_root / "bundle-manifest.json").write_text(
            json.dumps(repository_manifest, indent=2) + "\n",
            encoding="utf-8",
        )
    (output / "upload-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, default=root / "vault-archive.json")
    parser.add_argument("--topology", type=Path, default=root / "tools" / "fib-topology.json")
    parser.add_argument("--asset-root", type=Path, default=root / "website" / "assets" / "vault")
    parser.add_argument("--output", type=Path, default=root / ".node-bundles")
    parser.add_argument(
        "--branch",
        action="append",
        choices=(*PUBLIC_SPOKES, "all"),
        help="Build one branch. Repeat for multiple branches; use 'all' only for recovery builds.",
    )
    parser.add_argument("--secret", default=os.environ.get("THRESHOLD_NODE_SECRET"))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.secret:
        raise SystemExit("Set THRESHOLD_NODE_SECRET or pass --secret")
    requested_branches = args.branch or ["all"]
    if "all" in requested_branches and len(requested_branches) != 1:
        raise SystemExit("Use --branch all by itself")
    branches = PUBLIC_SPOKES if requested_branches == ["all"] else tuple(dict.fromkeys(requested_branches))
    manifest = build_bundles(
        args.archive.resolve(),
        args.topology.resolve(),
        args.asset_root.resolve(),
        args.output.resolve(),
        args.secret,
        branches,
    )
    print(
        f"Built {manifest['bundleCount']} activation bundles and {manifest['assetCount']} assets "
        f"({manifest['totalBytes'] / 1_000_000:.2f} MB) in {args.output.resolve()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
