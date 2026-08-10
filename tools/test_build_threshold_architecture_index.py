import tempfile
import unittest
from pathlib import Path

from tools.build_threshold_architecture_index import build_index, query_index


POLICY = {
    "sourceRoot": "vault/theghost",
    "sourcePattern": "**/*Architecture*.md",
    "authority": {
        "canonicalPrefixes": ["07 - Scaffolding/"],
        "canonical": 1.0,
        "mirror": 0.78,
        "reference": 0.65,
        "review": 0.5,
    },
    "retrieval": {
        "factWeight": {"authority": 0.8, "metadataCompleteness": 0.2},
        "accessWeight": {"factWeight": 0.7, "linkCentrality": 0.3},
        "query": {
            "exactTitle": 8,
            "titleToken": 4,
            "headingToken": 3,
            "tagOrAttribute": 3,
            "linkToken": 2,
            "bodyOccurrence": 1,
            "bodyOccurrenceCap": 5,
        },
    },
    "physics": {
        "dominancePairs": [["pressure", "drift"]],
        "forces": ["pressure", "drift", "resonance"],
        "layers": ["identity", "role"],
        "entities": ["lineage"],
        "states": ["stable", "collapsed"],
    },
    "provenance": {"note": "test"},
}


class ArchitectureIndexTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        canonical = self.root / "vault/theghost/07 - Scaffolding/Pressure Architecture.md"
        mirror = self.root / "vault/theghost/Cycles/Pressure Architecture.md"
        linked = self.root / "vault/theghost/07 - Scaffolding/Role Architecture.md"
        canonical.parent.mkdir(parents=True)
        mirror.parent.mkdir(parents=True)
        text = "---\ntags: [physics]\nconfidence: 0.85\nreview: false\n---\n# Pressure\nPressure drives drift."
        canonical.write_text(text, encoding="utf-8")
        mirror.write_text(text, encoding="utf-8")
        linked.write_text("# Role\n[[Pressure Architecture]]\nIdentity remains stable.", encoding="utf-8")

    def tearDown(self):
        self.temporary.cleanup()

    def test_builds_weighted_catalog_and_deduplicates(self):
        index = build_index(self.root, POLICY)
        self.assertEqual(index["documentCount"], 3)
        self.assertEqual(index["representativeCount"], 2)
        pressure = next(document for document in index["documents"] if document["isRepresentative"] and document["title"] == "Pressure Architecture")
        self.assertEqual(pressure["sourceClass"], "canonical")
        self.assertIn("pressure", pressure["attributes"]["forces"])
        self.assertEqual(pressure["inboundLinks"], 1)

    def test_query_accepts_explicit_attribute_weight(self):
        index = build_index(self.root, POLICY)
        results = query_index(self.root, index, POLICY, "pressure", {"pressure": 4.0}, False, 5)
        self.assertEqual(results[0]["title"], "Pressure Architecture")
        self.assertIn("attribute:pressure=4", results[0]["reasons"])


if __name__ == "__main__":
    unittest.main()