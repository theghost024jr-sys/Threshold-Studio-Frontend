import assert from "node:assert/strict";
import test from "node:test";

import { advanceGardenRuntime } from "../scripts/garden-runtime.js";

const state = {
  timestamp: "2026-08-17T03:00:00-04:00",
  growth: { rate: 0.849, stage: "branching", stability: 0.9, seededChambers: ["waterfall"] },
  adjacency: { density: 0.125, chambers: ["hub"], outerRingPetals: 13 },
  driftCapture: { rate: 0.595, capturedNodes: 2, availableNodes: 5 },
  pressureSpread: { intensity: 0.69, affectedBiomes: ["garden"] },
  biomeShift: { from: "house", to: "garden", progress: 0.995, path: ["house", "garden", "forest"] },
  environmentSignals: { active: [], warnings: [], transitions: [] }
};

test("advances all Garden world mechanics on an environmental tick", () => {
  const next = advanceGardenRuntime(state);
  assert.ok(next.growth.rate > state.growth.rate);
  assert.equal(next.growth.stage, "stable");
  assert.deepEqual(next.adjacency.chambers, ["hub", "waterfall"]);
  assert.equal(next.adjacency.density, 0.25);
  assert.equal(next.driftCapture.capturedNodes, 3);
  assert.ok(next.pressureSpread.intensity > state.pressureSpread.intensity);
  assert.equal(next.biomeShift.from, "garden");
  assert.equal(next.biomeShift.to, "forest");
  assert.ok(next.environmentSignals.active.includes("growth:stable"));
  assert.ok(next.environmentSignals.active.includes("drift-captured"));
  assert.ok(next.environmentSignals.transitions.includes("garden:forest"));
  assert.equal(next.runtimeTick, 1);
});

test("does not mutate the source Garden state", () => {
  const before = structuredClone(state);
  advanceGardenRuntime(state);
  assert.deepEqual(state, before);
});