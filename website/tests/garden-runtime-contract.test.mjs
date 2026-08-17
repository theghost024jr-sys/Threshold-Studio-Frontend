import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const runtimeDirectory = new URL("../runtime/garden/", import.meta.url);

test("activates all six Garden world feeds", async () => {
  const state = JSON.parse(await readFile(new URL("garden-runtime-state.json", runtimeDirectory), "utf8"));
  assert.equal(state.mode, "environment-tick");
  assert.equal(state.growth.stage, "branching");
  assert.equal(state.adjacency.outerRingPetals, 13);
  assert.equal(state.driftCapture.capturedNodes, 2);
  assert.deepEqual(state.pressureSpread.affectedBiomes, ["garden", "forest"]);
  assert.deepEqual(state.biomeShift.path, ["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);
  assert.deepEqual(state.diagnostics.feedsMissing, []);
});

test("records a coherent Garden environmental delta", async () => {
  const delta = JSON.parse(await readFile(new URL("garden-runtime-delta.json", runtimeDirectory), "utf8"));
  assert.equal(delta.diagnostics.deltaApplied, true);
  assert.equal(delta.diagnostics.noChangesDetected, false);
  assert.equal(delta.changes.growth.stage.new, "branching");
  assert.equal(delta.changes.biomeShift.progress.new, 0.68);
});

test("maps seven adaptive regions and the Fib 13 outer ring", async () => {
  const layout = JSON.parse(await readFile(new URL("garden-layout-map.json", runtimeDirectory), "utf8"));
  assert.equal(Object.keys(layout.regions).length, 7);
  assert.equal(layout.regions.fibFlower.petals, 13);
  assert.equal(layout.adaptiveRules.biomeShift.colorDriven, true);
  assert.equal(layout.diagnostics.status, "active");
});