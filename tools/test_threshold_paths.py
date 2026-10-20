import json
import os
import tempfile
import unittest
from pathlib import Path

from tools.threshold_paths import load_threshold_paths


class ThresholdPathTests(unittest.TestCase):
    def test_loads_final_canonical_layout(self) -> None:
        paths = load_threshold_paths()

        self.assertEqual(
            paths.vault_root,
            Path(r"C:\Users\James Romeo\Threshold\Threshold-Studio-Content\publish"),
        )
        self.assertEqual(paths.glyph_root, Path(r"C:\Threshold\vault\glyphs"))
        self.assertEqual(paths.system_root, Path(r"C:\Threshold"))
        self.assertEqual(paths.website_root, Path(r"C:\Threshold\website"))
        self.assertEqual(paths.html_inventory_root, Path(r"C:\Threshold\html-inventory"))
        self.assertEqual(paths.page_mapping_path, Path(r"C:\Threshold\website\page-mapping.json"))
        self.assertEqual(paths.page_templates_root, Path(r"C:\Threshold\website\page-templates"))
        self.assertEqual(paths.generated_pages_root, Path(r"C:\Threshold\website\generated-pages"))
        self.assertEqual(paths.render_jobs_path, Path(r"C:\Threshold\website\data\vault-render-jobs.json"))
        self.assertEqual(paths.world_root, Path(r"C:\Threshold\world"))
        self.assertEqual(paths.threshold_root, Path(r"C:\Threshold\threshold"))
        self.assertEqual(paths.node_bundles_root, Path(r"C:\Threshold\node-bundles"))

    @unittest.skipIf(os.name == "nt", "Portable Windows-path rebasing is only needed on non-Windows CI.")
    def test_rebases_repository_paths_for_portable_ci(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            repository_root = Path(temporary_directory)
            config_path = repository_root / "threshold.config.json"
            config_path.write_text(
                json.dumps(
                    {
                        "vaultRoot": r"C:\External\vault",
                        "glyphRoot": r"C:\Threshold\vault\glyphs",
                        "systemRoot": r"C:\Threshold",
                        "websiteRoot": r"C:\Threshold\website",
                        "htmlInventoryRoot": r"C:\Threshold\html-inventory",
                        "worldRoot": r"C:\Threshold\world",
                        "thresholdRoot": r"C:\Threshold\threshold",
                        "nodeBundlesRoot": r"C:\Threshold\node-bundles",
                        "scriptsRoot": r"C:\Threshold\scripts",
                        "toolsRoot": r"C:\Threshold\tools",
                        "pages": {
                            "mapping": "page-mapping.json",
                            "templates": "page-templates",
                            "output": "generated-pages",
                            "renderJobs": "data/vault-render-jobs.json",
                        },
                    }
                ),
                encoding="utf-8",
            )

            paths = load_threshold_paths(
                config_path,
                portable_paths=True,
                require_sources=False,
            )

            self.assertEqual(paths.system_root, repository_root)
            self.assertEqual(paths.website_root, repository_root / "website")
            self.assertEqual(
                paths.render_jobs_path,
                repository_root / "website" / "data" / "vault-render-jobs.json",
            )


if __name__ == "__main__":
    unittest.main()