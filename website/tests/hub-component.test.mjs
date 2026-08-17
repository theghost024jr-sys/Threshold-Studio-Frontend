import assert from "node:assert/strict";
import test from "node:test";

import { hubThemeClasses, ThresholdHubElement } from "../scripts/hub-component.js";

test("implements the seven-domain Hub component interface", () => {
  const component = new ThresholdHubElement();

  component.setEngine({ cycle: "early" });
  component.setBiome({ current: "house" });
  component.setChambers({ adjacent: ["basin"] });
  component.setSignals({ active: [] });
  component.setPlayer({ role: "traveler" });
  component.setVisual({ fallback: "orbital-wheel" });
  component.setNavigation({ routes: ["/hub"] });

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