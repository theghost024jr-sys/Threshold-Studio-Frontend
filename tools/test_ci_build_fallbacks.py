import os
import unittest
from unittest.mock import patch

from tools import build_node_bundles, build_vault_data


class CIBuildFallbackTests(unittest.TestCase):
    def test_vault_data_build_skips_missing_sources_in_ci_when_snapshot_exists(self) -> None:
        with (
            patch.object(build_vault_data, "load_threshold_paths", side_effect=FileNotFoundError("missing vault")),
            patch.object(build_vault_data.Path, "is_file", return_value=True),
            patch.dict(os.environ, {"CI": "true"}, clear=False),
        ):
            self.assertEqual(build_vault_data.main(), 0)

    def test_node_bundle_build_uses_snapshot_in_ci_when_sources_are_missing(self) -> None:
        repo_root = build_node_bundles.Path(build_node_bundles.__file__).resolve().parent.parent
        with (
            patch.object(build_node_bundles, "load_threshold_paths", side_effect=FileNotFoundError("missing config roots")),
            patch.object(build_node_bundles.Path, "is_file", return_value=True),
            patch.object(build_node_bundles, "build_node_bundles", return_value={"bundles": [], "sourceVault": "C:\\Threshold\\vault"}) as build_mock,
            patch.dict(os.environ, {"CI": "true"}, clear=False),
        ):
            self.assertEqual(build_node_bundles.main(), 0)
        fallback_paths = build_mock.call_args.args[0]
        self.assertEqual(fallback_paths.vault_root, repo_root)
        self.assertEqual(fallback_paths.glyph_root, repo_root / "vault" / "glyphs")
        self.assertEqual(fallback_paths.system_root, repo_root)
        self.assertEqual(fallback_paths.website_root, repo_root / "website")
        self.assertEqual(fallback_paths.html_inventory_root, repo_root / "html-inventory")
        self.assertEqual(fallback_paths.world_root, repo_root / "world")
        self.assertEqual(fallback_paths.threshold_root, repo_root)
        self.assertEqual(fallback_paths.node_bundles_root, repo_root / "node-bundles")
        self.assertEqual(fallback_paths.scripts_root, repo_root / "scripts")
        self.assertEqual(fallback_paths.tools_root, repo_root / "tools")

    def test_vault_data_build_raises_in_ci_when_snapshot_is_missing(self) -> None:
        with (
            patch.object(build_vault_data, "load_threshold_paths", side_effect=FileNotFoundError("missing vault")),
            patch.object(build_vault_data.Path, "is_file", return_value=False),
            patch.dict(os.environ, {"CI": "true"}, clear=False),
        ):
            with self.assertRaises(FileNotFoundError):
                build_vault_data.main()

    def test_node_bundle_build_raises_when_ci_snapshot_is_invalid(self) -> None:
        with (
            patch.object(build_node_bundles, "load_threshold_paths", side_effect=FileNotFoundError("missing config roots")),
            patch.object(build_node_bundles.Path, "is_file", return_value=True),
            patch.object(build_node_bundles.Path, "read_text", return_value='{"counts": {}}'),
            patch.dict(os.environ, {"CI": "true"}, clear=False),
        ):
            with self.assertRaises(ValueError):
                build_node_bundles.main()

    def test_vault_data_build_keeps_strict_failure_outside_ci(self) -> None:
        with (
            patch.object(build_vault_data, "load_threshold_paths", side_effect=FileNotFoundError("missing vault")),
            patch.dict(os.environ, {"CI": "false"}, clear=False),
        ):
            with self.assertRaises(FileNotFoundError):
                build_vault_data.main()


if __name__ == "__main__":
    unittest.main()
