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

    def test_node_bundle_build_skips_missing_sources_in_ci_when_snapshot_exists(self) -> None:
        with (
            patch.object(build_node_bundles, "load_threshold_paths", side_effect=FileNotFoundError("missing config roots")),
            patch.object(build_node_bundles.Path, "is_file", return_value=True),
            patch.dict(os.environ, {"CI": "true"}, clear=False),
        ):
            self.assertEqual(build_node_bundles.main(), 0)

    def test_vault_data_build_keeps_strict_failure_outside_ci(self) -> None:
        with (
            patch.object(build_vault_data, "load_threshold_paths", side_effect=FileNotFoundError("missing vault")),
            patch.dict(os.environ, {"CI": "false"}, clear=False),
        ):
            with self.assertRaises(FileNotFoundError):
                build_vault_data.main()


if __name__ == "__main__":
    unittest.main()
