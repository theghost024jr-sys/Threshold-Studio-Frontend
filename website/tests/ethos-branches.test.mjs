import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("preserves Ethos declarations and keeps the new principle as an independent seed", async () => {
  const [ethos, seed, vault] = await Promise.all([
    readFile(new URL("../ethos.html", import.meta.url), "utf8"),
    readFile(new URL("../pages/ethos-seed.html", import.meta.url), "utf8"),
    readFile(new URL("../data/threshold-vault.json", import.meta.url), "utf8")
  ]);
  for (const declaration of [
    "Threshold Is Not a Brand",
    "Presence Is the Currency",
    "Myth Is a Living System",
    "We Refuse to Collapse"
  ]) {
    assert.match(ethos, new RegExp(`<h2>${declaration}<\\/h2>`));
  }
  assert.match(ethos, /href="pages\/ethos-seed\.html"/);
  assert.match(seed, /Never knowingly distort what we have learned in order to preserve what we currently believe\./);
  assert.match(seed, /href="\/ethos\.html">Return to Ethos/);
  assert.doesNotMatch(ethos, /Guardrails\.md|Cohesion Under Pressure/);
  assert.doesNotMatch(vault, /"id":\s*"(?:guardrails|invariant00-cohesion-under-pressure)"/);
});
