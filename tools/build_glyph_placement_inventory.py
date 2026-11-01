from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

try:
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from threshold_paths import ThresholdPaths, load_threshold_paths


PORTAL_IMPORT_PATTERN = re.compile(
    r"const\s+(?P<component>\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\('\./pages/(?P<file>[^']+)'\)\)",
)
PORTAL_ROUTE_PATTERN = re.compile(r'<Route\s+path="(?P<route>[^"]+)"\s+element=\{<(?P<component>\w+)')


def portal_routes(portal_root: Path) -> dict[str, tuple[str, Path]]:
    app_path = portal_root / "src" / "App.jsx"
    app_source = app_path.read_text(encoding="utf-8")
    imports = {
        match.group("component"): portal_root / "src" / "pages" / match.group("file")
        for match in PORTAL_IMPORT_PATTERN.finditer(app_source)
    }
    return {
        match.group("component"): (match.group("route"), imports[match.group("component")])
        for match in PORTAL_ROUTE_PATTERN.finditer(app_source)
        if match.group("component") in imports
    }


def build_placement_inventory(paths: ThresholdPaths) -> dict[str, Any]:
    corpus = json.loads((paths.website_root / "data" / "glyph-corpus.json").read_text(encoding="utf-8"))
    glyph_config = json.loads((paths.website_root / "config" / "glyphs.json").read_text(encoding="utf-8"))
    living_pages = json.loads((paths.website_root / "config" / "living-pages.json").read_text(encoding="utf-8"))
    living_by_note = {page["noteId"]: page for page in living_pages.get("pages", [])}
    portal = portal_routes(paths.website_root / "portal")

    records: list[dict[str, Any]] = []
    for glyph in corpus["records"]:
        placements: list[dict[str, str]] = []
        archive_id = Path(glyph["sourceRelativePath"]).stem
        glyph_config_entry = glyph_config.get("glyphs", {}).get(archive_id.replace("glyph_", ""))
        living_page = living_by_note.get(archive_id)
        if glyph_config_entry:
            placements.append(
                {
                    "surface": "HTML Glyph Archive",
                    "route": f"/glyphs.html#glyph-{glyph_config_entry['id']}",
                    "asset": glyph_config_entry["asset"],
                    "interaction": "explicit Archive path",
                    "evidence": "website/config/glyphs.json",
                }
            )
        if living_page:
            placements.append(
                {
                    "surface": "Learning Wheel seasonal page",
                    "route": living_page["route"],
                    "asset": glyph_config_entry["asset"] if glyph_config_entry else "",
                    "interaction": "double-click glyph return",
                    "evidence": "website/config/living-pages.json; website/scripts/living-page.js",
                }
            )
        for component, (route, source_path) in portal.items():
            if glyph["title"].casefold() in source_path.read_text(encoding="utf-8").casefold():
                placements.append(
                    {
                        "surface": f"Portal {component}",
                        "route": f"/portal{route}",
                        "asset": "",
                        "interaction": "source-defined page interaction",
                        "evidence": str(source_path.relative_to(paths.website_root)).replace("\\", "/"),
                    }
                )
        records.append(
            {
                **glyph,
                "placements": placements,
                "missingPlacement": glyph["kind"] == "glyph" and not placements,
            }
        )

    return {
        "version": 1,
        "source": "glyph-corpus placement audit",
        "counts": {
            "records": len(records),
            "placed": sum(bool(record["placements"]) for record in records),
            "missingPlacement": sum(record["missingPlacement"] for record in records),
        },
        "records": records,
    }


def main() -> int:
    paths = load_threshold_paths()
    inventory = build_placement_inventory(paths)
    output = paths.website_root / "data" / "glyph-placement-inventory.json"
    output.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Glyph placement inventory built with {inventory['counts']['missingPlacement']} unplaced glyph records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
