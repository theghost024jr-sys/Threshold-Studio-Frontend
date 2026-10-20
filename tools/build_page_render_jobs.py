from __future__ import annotations

import argparse
import json
from typing import TYPE_CHECKING

try:
    from tools.build_vault_data import build_vault_render_jobs
    from tools.threshold_paths import ThresholdPaths, load_threshold_paths
except ModuleNotFoundError:
    from build_vault_data import build_vault_render_jobs
    from threshold_paths import ThresholdPaths, load_threshold_paths

if TYPE_CHECKING:
    from engine.contracts import PageRenderJobs


def build_page_render_jobs(paths: ThresholdPaths) -> PageRenderJobs:
    vault_data_path = paths.website_root / "data" / "threshold-vault.json"
    vault_data = json.loads(vault_data_path.read_text(encoding="utf-8"))
    if not isinstance(vault_data, dict) or not isinstance(vault_data.get("documents"), list):
        raise ValueError("Generated vault data must contain a documents array")

    payload = build_vault_render_jobs(paths, vault_data["documents"])
    paths.render_jobs_path.parent.mkdir(parents=True, exist_ok=True)
    paths.render_jobs_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Build validated page render jobs.")
    parser.add_argument(
        "--ci",
        action="store_true",
        help="Resolve configured Windows paths relative to this checkout and skip unrelated source checks.",
    )
    args = parser.parse_args()
    paths = load_threshold_paths(portable_paths=args.ci, require_sources=not args.ci)
    payload = build_page_render_jobs(paths)
    print(f"Validated {len(payload['jobs'])} page render job(s).")
    print(f"Render jobs written to {paths.render_jobs_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
