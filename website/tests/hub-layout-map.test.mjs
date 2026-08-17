import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutMap = JSON.parse(await readFile(
  new URL("../runtime/hub/hub-layout-map.json", import.meta.url),
  "utf8"
));

const eventTriggers = new Set([
  "biome-change",
  "new-adjacent-chamber",
  "no-recent-chambers",
  "signal-warning",
  "signal-distortion",
  "no-signals",
  "player-state-change",
  "new-route"
]);

test("declares a consistent adaptive Hub layout map", () => {
  assert.equal(layoutMap.id, "hub-layout-map");
  assert.equal(layoutMap.source, "hub-synthesis.json");
  assert.equal(layoutMap.layout.mode, "adaptive");
  assert.equal(Object.keys(layoutMap.regions).length, layoutMap.diagnostics.regionsDefined);
  assert.deepEqual(Object.keys(layoutMap.adaptiveRules), layoutMap.diagnostics.rulesets);
  assert.equal(layoutMap.diagnostics.layoutMode, layoutMap.layout.mode);
});

test("resolves every adaptive region trigger", () => {
  const ruleTriggers = new Set([
    ...Object.keys(layoutMap.adaptiveRules.cycle).map((value) => `cycle-${value}`),
    ...Object.keys(layoutMap.adaptiveRules.enginePressure).map((value) => `pressure-${value}`),
    ...Object.keys(layoutMap.adaptiveRules.drift).map((value) => `drift-${value}`)
  ]);
  const knownTriggers = new Set([...ruleTriggers, ...eventTriggers]);

  for (const [regionName, region] of Object.entries(layoutMap.regions)) {
    for (const trigger of [...(region.expandsOn || []), ...(region.contractsOn || [])]) {
      assert.ok(knownTriggers.has(trigger), `${regionName} uses unknown trigger ${trigger}`);
    }
  }
});