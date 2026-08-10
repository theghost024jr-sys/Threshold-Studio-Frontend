"""Build and query a weighted catalog of read-only Threshold architecture notes."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


FRONTMATTER_BOUNDARY = "---"
HEADING_PATTERN = re.compile(r"^#{1,6}\s+(.+?)\s*$", re.MULTILINE)
WIKILINK_PATTERN = re.compile(r"\[\[([^\]]+)\]\]")
TOKEN_PATTERN = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)?")


def parse_scalar(value: str) -> Any:
    normalized = value.strip()
    if normalized.lower() in {"true", "false"}:
        return normalized.lower() == "true"
    try:
        return float(normalized)
    except ValueError:
        pass
    if normalized.startswith("[") and normalized.endswith("]"):
        return [
            item.strip().strip("\"'").removeprefix("#")
            for item in normalized[1:-1].split(",")
            if item.strip()
        ]
    return normalized.strip("\"'")


def split_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_BOUNDARY:
        return {}, text
    try:
        end = next(
            index for index, line in enumerate(lines[1:], start=1)
            if line.strip() == FRONTMATTER_BOUNDARY
        )
    except StopIteration:
        return {}, text
    metadata: dict[str, Any] = {}
    for line in lines[1:end]:
        if ":" not in line or line[:1].isspace():
            continue
        key, value = line.split(":", 1)
        metadata[key.strip()] = parse_scalar(value)
    return metadata, "\n".join(lines[end + 1 :])


def normalize_name(value: str) -> str:
    return " ".join(TOKEN_PATTERN.findall(value.casefold()))


def extract_links(body: str) -> list[str]:
    links = []
    for match in WIKILINK_PATTERN.findall(body):
        target = match.split("|", 1)[0].split("#", 1)[0].strip()
        if target:
            links.append(target.replace("\\", "/"))
    return sorted(set(links), key=str.casefold)


def classify_source(relative_path: str, metadata: dict[str, Any], policy: dict[str, Any]) -> str:
    if metadata.get("review") is True or relative_path.startswith("Review/"):
        return "review"
    if any(relative_path.startswith(prefix) for prefix in policy["authority"]["canonicalPrefixes"]):
        return "canonical"
    if relative_path.startswith("99 - Reference/"):
        return "reference"
    return "mirror"


def controlled_attributes(text: str, policy: dict[str, Any]) -> dict[str, list[str]]:
    normalized = normalize_name(text)
    attributes: dict[str, list[str]] = {}
    for group in ("forces", "layers", "entities", "states"):
        attributes[group] = [
            term for term in policy["physics"][group]
            if re.search(rf"\b{re.escape(normalize_name(term))}\b", normalized)
        ]
    return attributes


def metadata_completeness(metadata: dict[str, Any]) -> float:
    present = sum(key in metadata for key in ("tags", "confidence", "review", "subsystem"))
    return present / 4


def source_authority(source_class: str, metadata: dict[str, Any], policy: dict[str, Any]) -> float:
    base = float(policy["authority"][source_class])
    confidence = metadata.get("confidence")
    if isinstance(confidence, (int, float)):
        base = min(base, float(confidence))
    return round(base, 4)


def build_index(root: Path, policy: dict[str, Any]) -> dict[str, Any]:
    source_root = root / policy["sourceRoot"]
    documents: list[dict[str, Any]] = []
    name_to_ids: defaultdict[str, list[str]] = defaultdict(list)

    for path in sorted(source_root.glob(policy["sourcePattern"]), key=lambda item: item.as_posix().casefold()):
        text = path.read_text(encoding="utf-8-sig")
        metadata, body = split_frontmatter(text)
        relative = path.relative_to(source_root).as_posix()
        normalized_body = "\n".join(line.rstrip() for line in body.strip().splitlines())
        digest = hashlib.sha256(normalized_body.encode("utf-8")).hexdigest()
        document_id = hashlib.sha1(relative.encode("utf-8")).hexdigest()[:12]
        title = path.stem
        source_class = classify_source(relative, metadata, policy)
        authority = source_authority(source_class, metadata, policy)
        fact_config = policy["retrieval"]["factWeight"]
        completeness = metadata_completeness(metadata)
        fact_weight = round(
            authority * float(fact_config["authority"])
            + completeness * float(fact_config["metadataCompleteness"]),
            4,
        )
        document = {
            "id": document_id,
            "title": title,
            "path": f"{policy['sourceRoot']}/{relative}",
            "relativePath": relative,
            "sourceClass": source_class,
            "authority": authority,
            "factWeight": fact_weight,
            "confidence": metadata.get("confidence"),
            "review": bool(metadata.get("review", False)),
            "tags": metadata.get("tags", []) if isinstance(metadata.get("tags", []), list) else [],
            "subsystem": metadata.get("subsystem"),
            "headings": HEADING_PATTERN.findall(body),
            "links": extract_links(body),
            "attributes": controlled_attributes(f"{title}\n{body}", policy),
            "contentHash": digest,
            "body": body,
        }
        documents.append(document)
        name_to_ids[normalize_name(title)].append(document_id)

    inbound = Counter()
    for document in documents:
        for link in document["links"]:
            target_name = normalize_name(Path(link).stem)
            for target_id in name_to_ids.get(target_name, []):
                inbound[target_id] += 1
    max_inbound = max(inbound.values(), default=0)
    access_config = policy["retrieval"]["accessWeight"]
    hash_groups: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    for document in documents:
        hash_groups[document["contentHash"]].append(document)
        centrality = inbound[document["id"]] / max_inbound if max_inbound else 0.0
        document["inboundLinks"] = inbound[document["id"]]
        document["linkCentrality"] = round(centrality, 4)
        document["accessWeight"] = round(
            document["factWeight"] * float(access_config["factWeight"])
            + centrality * float(access_config["linkCentrality"]),
            4,
        )

    duplicate_groups = []
    for digest, group in hash_groups.items():
        ranked = sorted(
            group,
            key=lambda item: (-item["authority"], -item["factWeight"], item["relativePath"].casefold()),
        )
        representative = ranked[0]["id"]
        for document in group:
            document["representativeId"] = representative
            document["isRepresentative"] = document["id"] == representative
        if len(group) > 1:
            duplicate_groups.append({
                "contentHash": digest,
                "representativeId": representative,
                "documentIds": [document["id"] for document in ranked],
            })

    for document in documents:
        document.pop("body")
    return {
        "version": 1,
        "sourceRoot": policy["sourceRoot"],
        "documentCount": len(documents),
        "representativeCount": sum(document["isRepresentative"] for document in documents),
        "documents": documents,
        "duplicateGroups": duplicate_groups,
        "dominancePairs": policy["physics"]["dominancePairs"],
        "provenance": policy["provenance"],
    }


def query_index(
    root: Path,
    index: dict[str, Any],
    policy: dict[str, Any],
    query: str,
    attribute_weights: dict[str, float],
    include_duplicates: bool,
    limit: int,
) -> list[dict[str, Any]]:
    query_text = normalize_name(query)
    tokens = set(TOKEN_PATTERN.findall(query_text))
    config = policy["retrieval"]["query"]
    results = []
    for document in index["documents"]:
        if not include_duplicates and not document["isRepresentative"]:
            continue
        source = root / document["path"]
        _, body = split_frontmatter(source.read_text(encoding="utf-8-sig"))
        title = normalize_name(document["title"])
        headings = normalize_name(" ".join(document["headings"]))
        tags = normalize_name(" ".join(document["tags"]))
        links = normalize_name(" ".join(document["links"]))
        body_normalized = normalize_name(body)
        relevance = 0.0
        reasons = []
        if query_text and query_text in title:
            relevance += float(config["exactTitle"])
            reasons.append("exact-title")
        title_hits = sum(token in title.split() for token in tokens)
        heading_hits = sum(token in headings.split() for token in tokens)
        tag_hits = sum(token in tags.split() for token in tokens)
        link_hits = sum(token in links.split() for token in tokens)
        body_hits = min(
            int(config["bodyOccurrenceCap"]),
            sum(body_normalized.split().count(token) for token in tokens),
        )
        relevance += title_hits * float(config["titleToken"])
        relevance += heading_hits * float(config["headingToken"])
        relevance += tag_hits * float(config["tagOrAttribute"])
        relevance += link_hits * float(config["linkToken"])
        relevance += body_hits * float(config["bodyOccurrence"])
        if title_hits:
            reasons.append(f"title:{title_hits}")
        if heading_hits:
            reasons.append(f"heading:{heading_hits}")
        if body_hits:
            reasons.append(f"body:{body_hits}")
        flattened_attributes = {
            attribute for values in document["attributes"].values() for attribute in values
        }
        for attribute, weight in attribute_weights.items():
            if attribute in flattened_attributes:
                relevance += weight
                reasons.append(f"attribute:{attribute}={weight:g}")
        if tokens and not reasons:
            continue
        score = (
            relevance * (0.5 + 0.5 * float(document["accessWeight"]))
            if reasons else float(document["accessWeight"])
        )
        results.append({
            "id": document["id"],
            "title": document["title"],
            "path": document["path"],
            "score": round(score, 4),
            "sourceClass": document["sourceClass"],
            "attributes": document["attributes"],
            "reasons": reasons,
        })
    return sorted(results, key=lambda item: (-item["score"], item["path"].casefold()))[:limit]


def parse_attribute_weight(value: str) -> tuple[str, float]:
    try:
        name, raw_weight = value.split("=", 1)
        return normalize_name(name), float(raw_weight)
    except (ValueError, TypeError) as error:
        raise argparse.ArgumentTypeError("attribute weights use NAME=NUMBER") from error


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    repository = Path(__file__).resolve().parent.parent
    default_policy = Path(__file__).with_name("threshold_architecture_weights.json")
    default_output = repository / "architecture-index" / "threshold-architecture-index.json"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--policy", type=Path, default=default_policy)
    subparsers = parser.add_subparsers(dest="command", required=True)
    build_parser = subparsers.add_parser("build")
    build_parser.add_argument("--output", type=Path, default=default_output)
    query_parser = subparsers.add_parser("query")
    query_parser.add_argument("query")
    query_parser.add_argument("--index", type=Path, default=default_output)
    query_parser.add_argument("--attribute", action="append", type=parse_attribute_weight, default=[])
    query_parser.add_argument("--include-duplicates", action="store_true")
    query_parser.add_argument("--limit", type=int, default=10)
    args = parser.parse_args()
    policy = load_json(args.policy.resolve())
    if args.command == "build":
        index = build_index(repository, policy)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(
            f"Indexed {index['documentCount']} notes as {index['representativeCount']} representatives "
            f"in {args.output.resolve()}"
        )
        return 0
    index = load_json(args.index.resolve())
    weights = dict(args.attribute)
    print(json.dumps(query_index(
        repository,
        index,
        policy,
        args.query,
        weights,
        args.include_duplicates,
        args.limit,
    ), indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())