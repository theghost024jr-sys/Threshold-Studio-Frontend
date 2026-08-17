import assert from "node:assert/strict";
import test from "node:test";

import {
  hubAnimationState,
  hubThemeClasses,
  HUB_FEED_CALIBRATION,
  lerp,
  smoothHubAnimation,
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
    cycleSeconds: 2,
    driftLevel: "high",
    coreMinScale: 1,
    coreMaxScale: 1.1,
    pressureLevel: "critical",
    haloLowOpacity: 0.65,
    haloMidOpacity: 0.7749999999999999,
    haloHighOpacity: 0.8999999999999999,
    haloSeconds: 0.8,
    haloStrokeWidth: 14,
    biomeSeconds: 10,
    biomeDelaySeconds: -3,
    adjacencyNormalized: 0.75,
    signalMode: "burst"
  });
});

test("calibrates boundaries and smooths numeric targets by fifteen percent", () => {
  assert.equal(hubAnimationState({ drift: 0.999 }).driftLevel, "low");
  assert.equal(hubAnimationState({ drift: 1 }).coreMaxScale, 1.06);
  assert.equal(hubAnimationState({ drift: 3 }).coreMaxScale, 1.1);
  assert.equal(hubAnimationState({ pressure: 0.999 }).pressureLevel, "soft");
  assert.equal(hubAnimationState({ pressure: 1 }).pressureLevel, "tense");
  assert.equal(hubAnimationState({ pressure: 3 }).pressureLevel, "critical");
  assert.equal(HUB_FEED_CALIBRATION.smoothingAlpha, 0.15);
  assert.equal(lerp(6, 2), 5.4);

  const previous = hubAnimationState({ cycle: "early", drift: 0, pressure: 0, adjacency: 0, signals: "quiet" });
  const target = hubAnimationState({ cycle: "late", drift: 5, pressure: 5, adjacency: 1, signals: "burst" });
  const smoothed = smoothHubAnimation(previous, target);

  assert.ok(Math.abs(smoothed.coreMaxScale - 1.0405) < 1e-12);
  assert.ok(Math.abs(smoothed.haloHighOpacity - 0.3475) < 1e-12);
  assert.equal(smoothed.biomeSeconds, 14.8);
  assert.equal(smoothed.driftLevel, "high");
  assert.equal(smoothed.pressureLevel, "critical");
  assert.equal(smoothed.signalMode, "burst");
});

test("applies feed values to stable animated SVG layers", () => {
  const nodes = new Map();
  for (const id of ["hub-cycle-ring", "hub-core", "hub-biome-ring", "hub-halo"]) {
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

  assert.equal(nodes.get("#hub-cycle-ring").properties.get("animation-duration"), "4.000s");
  assert.equal(nodes.get("#hub-core").dataset.drift, "medium");
  assert.equal(nodes.get("#hub-core").properties.get("--hub-core-max-scale"), "1.060");
  assert.equal(nodes.get("#hub-biome-ring").properties.get("animation-delay"), "-1.000s");
  assert.equal(nodes.get("#hub-halo").dataset.pressure, "tense");
  assert.equal(nodes.get("#hub-halo").dataset.signals, "burst");
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