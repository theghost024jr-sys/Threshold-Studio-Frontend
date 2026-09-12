from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


CONFIG_PATH = Path(__file__).resolve().parent.parent / "threshold.config.json"


@dataclass(frozen=True)
class ThresholdPaths:
    vault_root: Path
    system_root: Path
    website_root: Path
    html_inventory_root: Path
    world_root: Path
    threshold_root: Path
    node_bundles_root: Path
    scripts_root: Path
    tools_root: Path

    def require_sources(self) -> None:
        for label, path in (
            ("vaultRoot", self.vault_root),
            ("systemRoot", self.system_root),
            ("websiteRoot", self.website_root),
            ("htmlInventoryRoot", self.html_inventory_root),
            ("worldRoot", self.world_root),
            ("thresholdRoot", self.threshold_root),
            ("scriptsRoot", self.scripts_root),
            ("toolsRoot", self.tools_root),
        ):
            if not path.is_dir():
                raise FileNotFoundError(f"Configured {label} does not exist: {path}")


def load_threshold_paths(config_path: Path = CONFIG_PATH) -> ThresholdPaths:
    data = json.loads(config_path.read_text(encoding="utf-8"))
    paths = ThresholdPaths(
        vault_root=Path(data["vaultRoot"]),
        system_root=Path(data["systemRoot"]),
        website_root=Path(data["websiteRoot"]),
        html_inventory_root=Path(data["htmlInventoryRoot"]),
        world_root=Path(data["worldRoot"]),
        threshold_root=Path(data["thresholdRoot"]),
        node_bundles_root=Path(data["nodeBundlesRoot"]),
        scripts_root=Path(data["scriptsRoot"]),
        tools_root=Path(data["toolsRoot"]),
    )
    paths.require_sources()
    return paths