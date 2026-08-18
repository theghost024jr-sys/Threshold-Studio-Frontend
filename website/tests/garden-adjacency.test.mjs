import assert from "node:assert/strict";
import test from "node:test";

import {
  GARDEN_ADJACENCY_NEIGHBORS,
  propagateGardenAdjacency
} from "../scripts/garden-adjacency.js";

const gardenState = {
  growth: { stability: 0.8 },
  adjacency: { density: 0.6 },
  pressureSpread: { intensity: 0.5 },
  driftCapture: { rate: 0.4 },
  biomeShift: { from: "house", to: "garden" },
  environmentSignals: { active: ["germination"], warnings: [], transitions: [] }
};

function chamber() {
  return {
    environment: {
      stability: 0.4,
      coherence: 0.2,
      tension: 0.1,
      drift: 0.2,
      biome: "house",
      signal: null
    }
  };
}

test("propagates Garden influence to each canonical neighboring chamber", () => {
  const world = {
    chambers: {
      herbroom: chamber(),
      basin: chamber(),
      waterfall: chamber(),
      forest: chamber(),
      hub: chamber()
    }
  };
  const before = structuredClone(world);
  const next = propagateGardenAdjacency(world, gardenState);

  for (const id of GARDEN_ADJACENCY_NEIGHBORS) {
    assert.deepEqual(next.chambers[id].environment, {
      stability: 0.5,
      coherence: 0.28,
      tension: 0.22,
      drift: 0.23,
      biome: "garden",
      signal: gardenState.environmentSignals
    });
    const delta = next.chambers[id].environmentDelta;
    assert.ok(Math.abs(delta.stability - 0.1) < Number.EPSILON);
    assert.ok(Math.abs(delta.coherence - 0.08) < Number.EPSILON);
    assert.ok(Math.abs(delta.tension - 0.12) < Number.EPSILON);
    assert.ok(Math.abs(delta.drift - 0.03) < Number.EPSILON);
    assert.equal(delta.biome, true);
    assert.equal(delta.signal, true);
  }
  assert.deepEqual(next.chambers.hub, before.chambers.hub);
  assert.deepEqual(world, before);
});

test("skips absent neighbors and supports an explicit topology", () => {
  const world = { chambers: { grove: chamber() } };
  const next = propagateGardenAdjacency(world, gardenState, { neighbors: ["grove", "missing"] });
  assert.equal(next.chambers.grove.environment.biome, "garden");
  assert.equal(next.chambers.missing, undefined);
});

test("rejects worlds without a chamber registry", () => {
  assert.throws(() => propagateGardenAdjacency({}, gardenState), /world\.chambers/);
});