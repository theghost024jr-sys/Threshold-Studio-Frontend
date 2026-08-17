import assert from "node:assert/strict";
import test from "node:test";

import {
  bindGardenComponent,
  GARDEN_FEEDS,
  gardenFeedSnapshot,
  loadGardenState,
  startGardenBinding
} from "../scripts/garden-frontend-binding.js";

const state = {
  growth: { rate: 0.62, stage: "branching" },
  adjacency: { density: 0.5, chambers: ["hub", "herbroom"] },
  driftCapture: { rate: 0.4, capturedNodes: 2 },
  pressureSpread: { intensity: 0.35, direction: "outward" },
  biomeShift: { from: "house", to: "garden", progress: 0.68 },
  environmentSignals: { active: ["germination"], warnings: [], transitions: ["house:garden"] },
  visual: { asset: "garden/animated-garden.svg", assetExists: true },
  navigation: { routes: ["/garden"], mode: "environmental" }
};

function component() {
  const calls = [];
  return {
    calls,
    setGrowth: (value) => calls.push(["growth", value]),
    setAdjacency: (value) => calls.push(["adjacency", value]),
    setDriftCapture: (value) => calls.push(["drift-capture", value]),
    setPressureSpread: (value) => calls.push(["pressure-spread", value]),
    setBiomeShift: (value) => calls.push(["biome-shift", value]),
    setEnvironmentSignals: (value) => calls.push(["environment-signals", value]),
    setVisual: (value) => calls.push(["visual", value]),
    setNavigation: (value) => calls.push(["navigation", value]),
    updateGardenAnimation: (value) => calls.push(["animation", value])
  };
}

test("loads uncached Garden runtime state", async () => {
  const requests = [];
  const result = await loadGardenState({
    fetchImpl: async (...args) => {
      requests.push(args);
      return { ok: true, json: async () => state };
    }
  });
  assert.equal(result, state);
  assert.deepEqual(requests, [["/runtime/garden/garden-runtime-state.json", { cache: "no-store" }]]);
});

test("binds all Garden domains and six world feeds", () => {
  const target = component();
  bindGardenComponent(state, target);
  assert.deepEqual(target.calls.map(([domain]) => domain), [
    "growth", "adjacency", "drift-capture", "pressure-spread", "biome-shift",
    "environment-signals", "visual", "navigation", "animation"
  ]);
  assert.deepEqual(target.calls.at(-1)[1], gardenFeedSnapshot(state));
  assert.deepEqual(GARDEN_FEEDS, [
    "growth", "adjacency", "drift-capture", "pressure-spread", "biome-shift", "environment-signals"
  ]);
});

test("refreshes on the environmental heartbeat and stops", async () => {
  const listeners = new Map();
  const intervals = new Map();
  const eventTarget = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name)
  };
  const target = component();
  let loads = 0;
  const updates = [];
  const stop = startGardenBinding(target, {
    eventTarget,
    setIntervalImpl: (listener, intervalMs) => {
      intervals.set(1, { listener, intervalMs });
      return 1;
    },
    clearIntervalImpl: (id) => intervals.delete(id),
    loadState: async () => {
      loads += 1;
      return state;
    },
    onUpdate: (feeds) => updates.push(feeds)
  });

  await new Promise((resolve) => setImmediate(resolve));
  await listeners.get("threshold:heartbeat-field")();
  assert.equal(loads, 2);
  assert.equal(updates.length, 2);
  assert.ok(updates[1].growth.rate > updates[0].growth.rate);
  assert.equal(updates[1].runtimeTick, undefined);
  assert.equal(intervals.get(1).intervalMs, 12000);
  stop();
  assert.equal(listeners.has("threshold:heartbeat-field"), false);
  assert.equal(intervals.size, 0);
});

test("rejects incomplete Garden component adapters", () => {
  assert.throws(() => bindGardenComponent(state, {}), /setGrowth/);
});