import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const websiteDirectory = new URL("../", import.meta.url);

test("ships and activates the five-layer Hub vector blueprint", async () => {
  const [svg, stateText] = await Promise.all([
    readFile(new URL("assets/hub.svg", websiteDirectory), "utf8"),
    readFile(new URL("runtime/hub/hub-runtime-state.json", websiteDirectory), "utf8")
  ]);
  const state = JSON.parse(stateText);

  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.match(svg, /cx="256" cy="256" r="60"/);
  assert.equal((svg.match(/A140 140/g) || []).length, 3);
  assert.equal((svg.match(/A160 160/g) || []).length, 7);
  assert.match(svg, /r="200"[\s\S]*stroke-width="24"/);
  assert.match(svg, /r="240"[\s\S]*opacity="0\.10"/);

  for (const color of Object.values(state.biome.palette)) {
    assert.ok(svg.includes(`stroke="${color}"`), `missing biome stroke ${color}`);
  }

  assert.equal(state.visual.asset, "hub.svg");
  assert.equal(state.visual.assetExists, true);
  assert.deepEqual(state.diagnostics.assetMissing, []);
});