import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("activates the canonical first crossing through the Engine before navigation", async () => {
  const source = await readFile(new URL("../scripts/main-hub-engine.js", import.meta.url), "utf8");

  assert.match(source, /createEngineInterface/);
  assert.match(source, /new Set\(\["housegarden"\]\)/);
  assert.match(source, /await engine\.tick\(\)/);
  assert.match(source, /await engine\.activateNode\("housegarden", canonicalNodeIds\)/);
  assert.match(source, /window\.location\.assign\(crossing\.href\)/);
});
