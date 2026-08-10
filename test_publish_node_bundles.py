import json
import tempfile
import unittest
from pathlib import Path

from tools.publish_node_bundles import MAX_OBJECT_BYTES, build_bundles, package_assets, validate_topology


class ActivatedAssetTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.assets = self.root / "assets"
        self.output = self.root / "output"
        self.assets.mkdir()

    def tearDown(self):
        self.temporary.cleanup()

    def package(self, value):
        return package_assets(value, self.assets, self.output, "repo", "weather", "token")

    def test_packages_duplicate_asset_once_and_rewrites_every_reference(self):
        source = self.assets / "nested" / "mist.png"
        source.parent.mkdir()
        source.write_bytes(b"mist")
        value = [{"sourcePath": "nested/mist.png", "webPath": "mist.png"}] * 2

        records = self.package(value)

        self.assertEqual(len(records), 1)
        self.assertEqual(value[0]["webPath"], value[1]["webPath"])
        self.assertTrue(value[0]["webPath"].startswith("/api/nodes/assets/weather/token/"))

    def test_rejects_unsafe_asset_path(self):
        with self.assertRaisesRegex(ValueError, "Unsafe activated asset path"):
            self.package({"sourcePath": "../secret.png", "webPath": "secret.png"})

    def test_reports_missing_asset(self):
        with self.assertRaisesRegex(FileNotFoundError, "Missing activated asset"):
            self.package({"sourcePath": "missing.png", "webPath": "missing.png"})

    def test_rejects_oversized_asset(self):
        source = self.assets / "large.png"
        with source.open("wb") as stream:
            stream.truncate(MAX_OBJECT_BYTES + 1)
        with self.assertRaisesRegex(ValueError, "exceeds"):
            self.package({"sourcePath": "large.png", "webPath": "large.png"})


class TopologyTests(unittest.TestCase):
    def test_rejects_non_deeper_child(self):
        topology = {
            "fibs": [8, 5, 3, 2, 1],
            "spokeTemplate": {"fib": 8, "children": ["child"]},
            "nodes": {"child": {"fib": 8, "components": [], "children": []}},
        }

        with self.assertRaisesRegex(ValueError, "inward"):
            validate_topology(topology)

    def test_rejects_non_object_card(self):
        topology = {
            "fibs": [1, 2, 3],
            "spokeTemplate": {"fib": 2, "children": ["child"]},
            "nodes": {"child": {"fib": 3, "card": "snail", "components": [], "children": []}},
        }

        with self.assertRaisesRegex(ValueError, "card must be an object"):
            validate_topology(topology)


class BranchBuildTests(unittest.TestCase):
    def test_builds_shared_node_at_parent_relative_fib(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.json"
            topology = root / "topology.json"
            output = root / "output"
            archive.write_text(json.dumps({"archive": {}}))
            topology.write_text(json.dumps({
                "fibs": [8, 5, 3, 2, 1],
                "spokeTemplate": {"fib": 8, "children": []},
                "spokes": {
                    "ethos": {"fib": 8, "children": ["lantern-vault"]},
                    "house-garden": {"fib": 8, "children": ["lantern-pedal"]},
                },
                "nodes": {
                    "lantern-pedal": {
                        "fib": 5,
                        "repository": "threshold-fib-5-lantern-pedal",
                        "components": [],
                        "children": ["lantern-vault"],
                    },
                    "lantern-vault": {
                        "fib": 3,
                        "fibByParent": {"ethos": 5, "lantern-pedal": 3},
                        "repository": "threshold-fib-lantern-vault",
                        "components": [],
                        "children": [],
                    },
                },
            }))

            build_bundles(
                archive,
                topology,
                root,
                output,
                "secret",
                branches=("ethos", "house-garden"),
            )

            ethos_root = json.loads((output / "nodes" / "ethos" / "ethos.json").read_text())
            ethos_vault = json.loads((output / "nodes" / "ethos" / f"{ethos_root['children'][0]['activation']}.json").read_text())
            garden_root = json.loads((output / "nodes" / "house-garden" / "house-garden.json").read_text())
            pedal = json.loads((output / "nodes" / "house-garden" / f"{garden_root['children'][0]['activation']}.json").read_text())
            garden_vault = json.loads((output / "nodes" / "house-garden" / f"{pedal['children'][0]['activation']}.json").read_text())
            self.assertEqual(ethos_vault["fib"], 5)
            self.assertEqual(garden_vault["fib"], 3)

    def test_builds_spoke_specific_children_and_descendants(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.json"
            topology = root / "topology.json"
            output = root / "output"
            archive.write_text(json.dumps({"archive": {}}))
            topology.write_text(json.dumps({
                "fibs": [8, 5, 3, 2, 1],
                "spokeTemplate": {"fib": 8, "children": []},
                "spokes": {
                    "learning-wheel": {"fib": 8, "children": ["seasonal-alcove"]},
                },
                "nodes": {
                    "seasonal-alcove": {
                        "fib": 5,
                        "repository": "threshold-fib-5-seasonal-alcove",
                        "content": {"title": "Seasonal Alcove"},
                        "components": [],
                        "children": ["storm-cabinet"],
                    },
                    "storm-cabinet": {
                        "fib": 3,
                        "repository": "threshold-fib-3-storm-cabinet",
                        "components": [],
                        "children": [],
                    },
                },
            }))

            manifest = build_bundles(
                archive,
                topology,
                root,
                output,
                "secret",
                branches=("learning-wheel", "mythology"),
            )

            root_bundle = json.loads((output / "nodes" / "learning-wheel" / "learning-wheel.json").read_text())
            mythology_bundle = json.loads((output / "nodes" / "mythology" / "mythology.json").read_text())
            alcove = root_bundle["children"][0]
            alcove_bundle = json.loads((output / "nodes" / "learning-wheel" / f"{alcove['activation']}.json").read_text())
            cabinet = alcove_bundle["children"][0]
            cabinet_bundle = json.loads((output / "nodes" / "learning-wheel" / f"{cabinet['activation']}.json").read_text())
            self.assertEqual(manifest["bundleCount"], 4)
            self.assertEqual(alcove["id"], "seasonal-alcove")
            self.assertEqual(alcove_bundle["content"]["title"], "Seasonal Alcove")
            self.assertEqual(alcove_bundle["parent"]["id"], "learning-wheel")
            self.assertEqual(cabinet_bundle["id"], "storm-cabinet")
            self.assertEqual(cabinet_bundle["parent"]["id"], "seasonal-alcove")
            self.assertEqual(mythology_bundle["children"], [])

    def test_builds_only_selected_branch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.json"
            topology = root / "topology.json"
            assets = root / "assets"
            output = root / "output"
            assets.mkdir()
            archive.write_text(json.dumps({"archive": {"weather": {"fog": {"title": "Fog"}}}}))
            topology.write_text(json.dumps({
                "fibs": [8, 5, 3, 2, 1],
                "spokeTemplate": {"fib": 8, "children": ["fog"]},
                "nodes": {
                    "fog": {
                        "fib": 5,
                        "repository": "threshold-fib-5-fog",
                        "components": [{"type": "weather", "source": "weather.fog"}],
                        "children": [],
                    },
                },
            }))

            manifest = build_bundles(
                archive,
                topology,
                assets,
                output,
                "secret",
                branches=("mythology",),
            )

            self.assertEqual(manifest["branches"], ["mythology"])
            self.assertEqual(manifest["bundleCount"], 2)
            self.assertTrue((output / "nodes" / "mythology" / "mythology.json").is_file())
            self.assertFalse((output / "nodes" / "glyphs").exists())

    def test_rejects_unknown_branch(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.json"
            topology = root / "topology.json"
            archive.write_text(json.dumps({"archive": {}}))
            topology.write_text(json.dumps({
                "fibs": [1, 2],
                "spokeTemplate": {"fib": 2, "children": []},
                "nodes": {},
            }))

            with self.assertRaisesRegex(ValueError, "Unknown branch"):
                build_bundles(archive, topology, root, root / "output", "secret", branches=("unknown",))

    def test_packages_explicit_card_image_and_story(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "archive.json"
            topology = root / "topology.json"
            assets = root / "assets"
            output = root / "output"
            assets.mkdir()
            (assets / "snail.png").write_bytes(b"snail-image")
            (assets / "snail.md").write_text("# The Snail\n\nHe comes home.", encoding="utf-8")
            archive.write_text(json.dumps({"archive": {}}))
            topology.write_text(json.dumps({
                "fibs": [8, 5, 3, 2, 1],
                "spokeTemplate": {"fib": 8, "children": ["snail"]},
                "nodes": {
                    "snail": {
                        "fib": 5,
                        "label": "Snail",
                        "repository": "threshold-fib-5-snail",
                        "card": {
                            "title": "The Snail",
                            "image": {"sourcePath": "snail.png", "webPath": "snail.png", "alt": "The Snail"},
                            "story": {"sourcePath": "snail.md", "webPath": "snail.md", "extension": ".md"},
                        },
                        "components": [],
                        "children": [],
                    },
                },
            }))

            manifest = build_bundles(
                archive,
                topology,
                assets,
                output,
                "secret",
                branches=("house-garden",),
            )

            root_bundle = json.loads((output / "nodes" / "house-garden" / "house-garden.json").read_text())
            card = root_bundle["children"][0]["card"]
            self.assertTrue(card["image"]["webPath"].startswith("/api/nodes/assets/house-garden/house-garden/"))
            self.assertTrue(card["story"]["webPath"].startswith("/api/nodes/assets/house-garden/house-garden/"))
            self.assertEqual(manifest["assetCount"], 2)


if __name__ == "__main__":
    unittest.main()