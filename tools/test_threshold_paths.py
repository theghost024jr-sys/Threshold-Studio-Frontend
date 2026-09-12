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
        self.assertEqual(paths.world_root, Path(r"C:\Threshold\world"))
        self.assertEqual(paths.threshold_root, Path(r"C:\Threshold\threshold"))
        self.assertEqual(paths.node_bundles_root, Path(r"C:\Threshold\node-bundles"))


if __name__ == "__main__":
    unittest.main()