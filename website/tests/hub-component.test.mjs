import assert from "node:assert/strict";
import test from "node:test";

import {
  hubAnimationState,
  hubThemeClasses,
  ThresholdHubElement,
  updateHubAnimation
} from "../scripts/hub-component.js";

test("implements the feed-aware Hub component interface", () => {
  const component = new ThresholdHubElement();

  component.setEngine({ cycle: "early" });
  component.setBiome({ current: "house" });
  component.setChambers({ adjacent: ["basin"] });
  component.setSignals({ active: [] });
  component.setPlayer({ role: "traveler" });
  component.setVisual({ fallback: "orbital-wheel" });
  component.setNavigation({ routes: ["/hub"] });
  component.updateHubAnimation({ cycle: "early", drift: 0, pressure: 0, adjacency: [], signals: {} });

  assert.deepEqual(component.state, {
    engine: { cycle: "early" },
    biome: { current: "house" },
    chambers: { adjacent: ["basin"] },
    signals: { active: [] },
    player: { role: "traveler" },
    visual: { fallback: "orbital-wheel" },
    navigation: { routes: ["/hub"] }
  });
});

test("maps all five runtime feeds to bounded animation values", () => {
  assert.deepEqual(hubAnimationState({
    cycle: "late",
    drift: 3,
    pressure: 5,
    adjacency: ["basin", "herbroom", "waterfall"],
    signals: { active: ["pulse"], warnings: ["pressure"], distortions: [], environmental: [] }
  }), {
    cycleDuration: "2s",
    driftLevel: "high",
    coreMinScale: "1.056",
    coreMaxScale: "1.144",
    pressureOpacity: 1,
    haloLowOpacity: "0.500",
    haloMidOpacity: "0.850",
    haloHighOpacity: "1.000",
    haloDuration: "1.9s",
    haloStrokeWidth: "12px",
    biomeDuration: "10s",
    biomeDelay: "-3s",
    adjacencyCount: 3,
    signalCount: 2
  });
});

test("applies feed values to stable animated SVG layers", () => {
  const nodes = new Map();
  for (const id of ["hub-cycle-ring", "hub-engine-core", "hub-biome-ring", "hub-signal-halo"]) {
    const properties = new Map();
    nodes.set(`#${id}`, {
      dataset: {},
      properties,
      style: { setProperty: (name, value) => properties.set(name, value) }
    });
  }

  updateHubAnimation({ querySelector: (selector) => nodes.get(selector) }, {
    cycle: "mid",
    drift: 1,
    pressure: 2.5,
    adjacency: ["basin"],
    signals: { warnings: ["field"] }
  });

  assert.equal(nodes.get("#hub-cycle-ring").properties.get("animation-duration"), "3s");
  assert.equal(nodes.get("#hub-engine-core").dataset.drift, "medium");
  assert.equal(nodes.get("#hub-engine-core").properties.get("--hub-core-max-scale"), "1.092");
  assert.equal(nodes.get("#hub-biome-ring").properties.get("animation-delay"), "-1s");
  assert.equal(nodes.get("#hub-signal-halo").dataset.pressure, "0.5");
  assert.equal(nodes.get("#hub-signal-halo").dataset.signals, "1");
});

test("derives bounded theme classes from Hub runtime state", () => {
  assert.deepEqual(hubThemeClasses({
    engine: { cycle: "early", drift: 0, pressure: 0 },
    biome: { current: "house" },
    signals: { warnings: [], distortions: [], environmental: [] },
    visual: {
      pulse: {
        mode: "cycle-synced",
        intensity: { drift: "low", pressure: "low", cycle: "early" }
      }
    }
  }), {
    container: ["biome-house", "cycle-early", "drift-low", "pressure-low"],
    visual: ["pulse-cycle-synced"]
  });
});

test("normalizes numeric engine load at reactive class boundaries", () => {
  const cases = [
    { value: 0, level: "low" },
    { value: 1, level: "medium" },
    { value: 2.999, level: "medium" },
    { value: 3, level: "high" }
  ];

  for (const { value, level } of cases) {
    const theme = hubThemeClasses({
      engine: { drift: value, pressure: value },
      visual: { pulse: { intensity: { drift: "high", pressure: "high" } } }
    });
    assert.deepEqual(theme.container, [`drift-${level}`, `pressure-${level}`]);
  }

  assert.deepEqual(hubThemeClasses({
    engine: { drift: Number.NaN },
    visual: { pulse: { intensity: { drift: "medium", pressure: "low" } } }
  }).container, ["drift-medium", "pressure-low"]);
});

test("replaces stale theme classes and flags warning signals", () => {
  assert.deepEqual(hubThemeClasses({
    engine: { cycle: "late" },
    biome: { current: "root" },
    signals: { distortions: ["field-instability"] },
    visual: { pulse: { intensity: { drift: "high", pressure: "medium" } } }
  }), {
    container: ["biome-root", "cycle-late", "drift-high", "pressure-medium", "signal-warning"],
    visual: []
  });

  assert.deepEqual(hubThemeClasses({
    engine: { cycle: "untrusted-class" },
    biome: { current: "unknown" },
    visual: { pulse: { mode: "unknown", intensity: { drift: "extreme" } } }
  }), { container: [], visual: [] });
});