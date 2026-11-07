from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path, PurePosixPath, PureWindowsPath


CONFIG_PATH = Path(__file__).resolve().parent.parent / "threshold.config.json"


@dataclass(frozen=True)
class ThresholdPaths:
    vault_root: Path
    glyph_root: Path
    system_root: Path
    website_root: Path
    html_inventory_root: Path
    page_mapping_path: Path
    page_templates_root: Path
    generated_pages_root: Path
    render_jobs_path: Path
    world_root: Path
    threshold_root: Path
    node_bundles_root: Path
    scripts_root: Path
    tools_root: Path

    def require_sources(self) -> None:
        for label, path in (
            ("vaultRoot", self.vault_root),
            ("glyphRoot", self.glyph_root),
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


def load_threshold_paths(
    config_path: Path = CONFIG_PATH,
    *,
    portable_paths: bool = False,
    require_sources: bool = True,
) -> ThresholdPaths:
    data = json.loads(config_path.read_text(encoding="utf-8"))
    config_root = config_path.resolve().parent
    configured_system_root = data["systemRoot"]

    def configured_root(key: str) -> Path:
        value = data[key]
        configured = Path(value)
        if configured.is_absolute() or not portable_paths:
            return configured

        windows_path = PureWindowsPath(value)
        windows_system_root = PureWindowsPath(configured_system_root)
        if windows_path.is_absolute() and windows_system_root.is_absolute():
            try:
                relative = windows_path.relative_to(windows_system_root)
            except ValueError:
                return configured
            return config_root.joinpath(*relative.parts)
        return configured

    website_root = configured_root("websiteRoot")
    pages = data["pages"]

    def website_path(key: str) -> Path:
        value = pages.get(key)
        if not isinstance(value, str) or not value or "\\" in value:
            raise ValueError(f"pages.{key} must be a relative POSIX path")
        parts = value.split("/")
        relative = PurePosixPath(value)
        if (
            relative.is_absolute()
            or any(part in {"", ".", ".."} for part in parts)
        ):
            raise ValueError(f"pages.{key} escapes websiteRoot: {value}")
        resolved = website_root.joinpath(*relative.parts).resolve()
        if not resolved.is_relative_to(website_root.resolve()):
            raise ValueError(f"pages.{key} escapes websiteRoot: {value}")
        return resolved

    paths = ThresholdPaths(
        vault_root=configured_root("vaultRoot"),
        glyph_root=configured_root("glyphRoot"),
        system_root=configured_root("systemRoot"),
        website_root=website_root,
        html_inventory_root=configured_root("htmlInventoryRoot"),
        page_mapping_path=website_path("mapping"),
        page_templates_root=website_path("templates"),
        generated_pages_root=website_path("output"),
        render_jobs_path=website_path("renderJobs"),
        world_root=configured_root("worldRoot"),
        threshold_root=configured_root("thresholdRoot"),
        node_bundles_root=configured_root("nodeBundlesRoot"),
        scripts_root=configured_root("scriptsRoot"),
        tools_root=configured_root("toolsRoot"),
    )
    if require_sources:
        paths.require_sources()
    return paths