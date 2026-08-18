import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceGardenRuntime,
  updateGardenRuntime
} from "../scripts/garden-runtime.js";

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

test("ingests and smooths structured world environment feeds", () => {
  const before = structuredClone(state);
  const { state: next, delta } = updateGardenRuntime(state, {
    environment: {
      growth: 1,
      adjacency: { density: 0.5, chambers: ["hub", "garden"] },
      driftCapture: 0.8,
      pressureSpread: { intensity: 0.9, direction: "outward" },
      biomeShift: "forest",
      signals: "burst"
    }
  });

  assert.equal(next.growth.rate, 0.87165);
  assert.equal(next.adjacency.density, 0.18125);
  assert.equal(next.driftCapture.rate, 0.62575);
  assert.ok(Math.abs(next.pressureSpread.intensity - 0.7215) < Number.EPSILON);
  assert.deepEqual(next.adjacency.chambers, ["hub", "garden"]);
  assert.deepEqual(next.biomeShift, { ...state.biomeShift, from: "garden", to: "forest", progress: 0 });
  assert.deepEqual(next.environmentSignals.active, ["burst"]);
  assert.equal(next.runtimeTick, 1);
  assert.deepEqual(delta.changes.growth.old, state.growth);
  assert.deepEqual(delta.changes.growth.new, next.growth);
  assert.equal(delta.diagnostics.deltaApplied, true);
  assert.deepEqual(state, before);
});

test("rejects worlds without an environment feed", () => {
  assert.throws(() => updateGardenRuntime(state, {}), /world\.environment/);
});