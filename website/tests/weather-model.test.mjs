import assert from "node:assert/strict";
import test from "node:test";
import {
  createWeatherSnapshot,
  THRESHOLD_WEATHER_CYCLE_PHASES,
  THRESHOLD_WEATHER_SEASONS
} from "../weather-model.js";

function createInput(overrides = {}) {
  return {
    nodeId: "home",
    cyclePhase: "Void",
    seasonState: "Winter",
    drivers: {
      drift: [0, -1],
      pressure: 0,
      resonance: [0, 0],
      density: 0
    },
    phenomena: { environmental: null, symbolic: null, astral: "stillness-field" },
    ...overrides
  };
}

test("keeps cycle phase and seasonal state as independent weather dimensions", () => {
  const snapshot = createWeatherSnapshot(createInput({
    cyclePhase: "Coherence",
    seasonState: "Autumn",
    drivers: { drift: [1], pressure: 2, resonance: 0.5, density: 3 }
  }));

  assert.deepEqual(THRESHOLD_WEATHER_CYCLE_PHASES, [
    "Coherence", "Tension", "Collapse", "Void", "Renewal"
  ]);
  assert.deepEqual(THRESHOLD_WEATHER_SEASONS, [
    "Winter", "Spring", "Summer", "Autumn"
  ]);
  assert.equal(snapshot.cyclePhase, "Coherence");
  assert.equal(snapshot.seasonState, "Autumn");
  assert.equal(snapshot.signatures.cycle.glyph, "Circle");
  assert.equal(snapshot.signatures.season.drift, "inward");
  assert.deepEqual(snapshot.scope, { kind: "local", id: "home" });
});

test("keeps the Tree glyph attached to the Void cycle phase", () => {
  const snapshot = createWeatherSnapshot(createInput());

  assert.equal(snapshot.cyclePhase, "Void");
  assert.equal(snapshot.signatures.cycle.glyph, "Tree");
});

test("records the moving tree as a distinct environmental phenomenon", () => {
  const snapshot = createWeatherSnapshot(createInput({
    phenomena: {
      environmental: "moving-tree-following",
      symbolic: null,
      astral: null
    }
  }));

  assert.equal(snapshot.phenomena.environmental, "moving-tree-following");
  assert.equal(snapshot.phenomena.symbolic, null);
});

test("rejects missing, malformed, or non-finite weather drivers", () => {
  assert.throws(() => createWeatherSnapshot(createInput({
    drivers: { drift: [], pressure: 0, resonance: 0, density: 0 }
  })), /drift must be a non-empty numeric vector/);
  assert.throws(() => createWeatherSnapshot(createInput({
    drivers: { drift: [0, Number.NaN], pressure: 0, resonance: 0, density: 0 }
  })), /drivers\.drift\[1\] must be a finite number/);
  assert.throws(() => createWeatherSnapshot(createInput({
    drivers: { drift: [0], pressure: 0, resonance: [], density: 0 }
  })), /resonance spectrum must not be empty/);
  assert.throws(() => createWeatherSnapshot(createInput({
    cyclePhase: "Storm"
  })), /cyclePhase must be one of/);
});

test("freezes local weather snapshots and their driver arrays", () => {
  const snapshot = createWeatherSnapshot(createInput());

  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.drivers));
  assert.ok(Object.isFrozen(snapshot.drivers.drift));
  assert.ok(Object.isFrozen(snapshot.phenomena));
});
