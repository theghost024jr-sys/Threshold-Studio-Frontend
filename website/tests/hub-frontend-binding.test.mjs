import assert from "node:assert/strict";
import test from "node:test";

import {
  bindHubComponent,
  HUB_FEEDS,
  hubFeedSnapshot,
  loadHubState,
  startHubBinding
} from "../scripts/hub-frontend-binding.js";

const state = {
  engine: { drift: 0, pressure: 0, cycle: "early", cyclePosition: 0, worldState: "stable" },
  biome: { current: "house", color: "#F4D03F", palette: { house: "#F4D03F" } },
  chambers: { adjacent: ["basin"], reachable: ["house-garden"], recent: [] },
  signals: { active: [], warnings: [], distortions: [], environmental: [] },
  player: { role: "traveler", state: "stable", location: "hub" },
  visual: { asset: "hub.png", assetExists: false, fallback: "orbital-wheel", pulse: {} },
  navigation: { routes: ["/hub"], mode: "dynamic" }
};

function component() {
  const calls = [];
  return {
    calls,
    setEngine: (value) => calls.push(["engine", value]),
    setBiome: (value) => calls.push(["biome", value]),
    setChambers: (value) => calls.push(["chambers", value]),
    setSignals: (value) => calls.push(["signals", value]),
    setPlayer: (value) => calls.push(["player", value]),
    setVisual: (value) => calls.push(["visual", value]),
    setNavigation: (value) => calls.push(["navigation", value]),
    updateHubAnimation: (value) => calls.push(["animation", value])
  };
}

test("loads uncached Hub runtime state", async () => {
  const requests = [];
  const result = await loadHubState({
    fetchImpl: async (...args) => {
      requests.push(args);
      return { ok: true, json: async () => state };
    }
  });

  assert.equal(result, state);
  assert.deepEqual(requests, [["/runtime/hub/hub-runtime-state.json", { cache: "no-store" }]]);
});

test("binds all state domains and the five animation feeds", () => {
  const target = component();
  bindHubComponent(state, target);

  assert.deepEqual(target.calls.map(([domain]) => domain), [
    "engine", "biome", "chambers", "signals", "player", "visual", "navigation", "animation"
  ]);
  assert.deepEqual(target.calls.at(-1)[1], hubFeedSnapshot(state));
  assert.deepEqual(HUB_FEEDS, ["cycle", "drift", "pressure", "adjacency", "signals"]);
});

test("refreshes initially and on engine heartbeat, then stops", async () => {
  const listeners = new Map();
  const intervals = new Map();
  let nextInterval = 0;
  const eventTarget = {
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: (name) => listeners.delete(name)
  };
  const target = component();
  let loads = 0;
  const updates = [];
  const stop = startHubBinding(target, {
    eventTarget,
    setIntervalImpl: (listener, intervalMs) => {
      const id = ++nextInterval;
      intervals.set(id, { listener, intervalMs });
      return id;
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
  assert.deepEqual(updates[0], hubFeedSnapshot(state));
  assert.equal(intervals.get(1).intervalMs, 12000);

  stop();
  assert.equal(listeners.has("threshold:heartbeat-field"), false);
  assert.equal(intervals.size, 0);
});

test("rejects incomplete component adapters", () => {
  assert.throws(() => bindHubComponent(state, {}), /setEngine/);
});