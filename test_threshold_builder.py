import tempfile
import unittest
import json
from pathlib import Path

from threshold.builder.build_branch import build_branch
from threshold.builder.utils.file_ops import copy_tree, ensure_within
from threshold.builder.validate_branch import validate_branch


class FileOperationsTests(unittest.TestCase):
    def test_copies_only_source_tree(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            destination = root / "publish"
            (source / "nested").mkdir(parents=True)
            (source / "nested" / "node.json").write_text("{}", encoding="utf-8")

            copied = copy_tree(source, destination)

            self.assertEqual(copied, [Path("nested/node.json")])
            self.assertEqual((destination / "nested" / "node.json").read_text(), "{}")

    def test_rejects_path_escape(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaisesRegex(ValueError, "escapes"):
                ensure_within(root / "publish", root / "outside.txt")


class BranchBuilderTests(unittest.TestCase):
    def test_builds_only_selected_branch_with_source_provenance(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            mythology = root / "branches" / "mythology"
            glyphs = root / "branches" / "glyphs"
            (mythology / "src").mkdir(parents=True)
            glyphs.mkdir(parents=True)
            (mythology / "src" / "note.md").write_text("mist", encoding="utf-8")
            (mythology / "manifest.json").write_text(json.dumps({"id": "mythology", "activation": "mythology"}))
            (glyphs / "manifest.json").write_text(json.dumps({"id": "glyphs", "activation": "glyphs"}))

            build_branch("mythology", root)
            validate_branch("mythology", root)

            manifest = json.loads((root / "publish" / "branches" / "mythology" / "manifest.json").read_text())
            self.assertEqual(manifest["sourceFiles"], 1)
            self.assertEqual(len(manifest["sourceDigest"]), 64)
            self.assertFalse((root / "publish" / "branches" / "glyphs").exists())


if __name__ == "__main__":
    unittest.main()