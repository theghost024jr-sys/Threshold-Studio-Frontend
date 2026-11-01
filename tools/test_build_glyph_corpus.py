import tempfile
import unittest
from pathlib import Path

from tools.build_glyph_corpus import build_glyph_corpus


class GlyphCorpusTests(unittest.TestCase):
    def test_inventories_source_records_without_inferring_primitives(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            (root / "Glyphs.md").write_text("# Glyphs\n", encoding="utf-8")
            (root / "Hourglass Glyph.md").write_text(
                "---\ntitle: Hourglass Glyph\n---\n# Hourglass Glyph\n",
                encoding="utf-8",
            )
            (root / "_publish").mkdir()
            (root / "_publish" / "glyph_fog.md").write_text("# Fog Glyph\n", encoding="utf-8")
            (root / "_publish_candidates" / "Echo Glyph.md").parent.mkdir()
            (root / "_publish_candidates" / "Echo Glyph.md").write_text("# Echo Glyph\n", encoding="utf-8")

            corpus = build_glyph_corpus(root)

        self.assertEqual(corpus["counts"], {
            "records": 3,
            "glyphs": 1,
            "archiveReferences": 1,
            "catalogs": 1,
            "maps": 0,
            "archives": 0,
        })
        hourglass = next(record for record in corpus["records"] if record["title"] == "Hourglass Glyph")
        self.assertEqual(hourglass["primitives"]["category"], None)
        self.assertEqual(hourglass["primitives"]["strokes"], [])
        self.assertEqual(corpus["primitives"]["orientationEffects"]["left"], "memory")


if __name__ == "__main__":
    unittest.main()
