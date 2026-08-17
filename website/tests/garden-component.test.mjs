import assert from "node:assert/strict";
import test from "node:test";

import { gardenThemeClasses, ThresholdGardenElement } from "../scripts/garden-component.js";
import {
  applyGardenCalibration,
  GARDEN_FEED_CALIBRATION,
  gardenAnimationState,
  lerp,
  smoothGardenAnimation
} from "../scripts/garden-animation-binding.js";

const feeds = {
  growth: { rate: 0.62 },
  adjacency: { density: 0.5 },
  "drift-capture": { rate: 0.4 },
  "pressure-spread": { intensity: 0.35 },
  "biome-shift": { from: "house", to: "garden", progress: 0.68 },
  "environment-signals": { active: ["germination"], warnings: [], transitions: ["house:garden"] }
};

test("implements the six-domain Garden component interface", () => {
  const component = new ThresholdGardenElement();
  component.setGrowth({ rate: 0.62, stage: "branching" });
  component.setAdjacency({ density: 0.5 });
  component.setDriftCapture({ rate: 0.4 });
  component.setPressureSpread({ intensity: 0.35 });
  component.setBiomeShift({ from: "house", to: "garden", progress: 0.68 });
  component.setEnvironmentSignals({ active: ["germination"] });
  assert.equal(component.state.growth.stage, "branching");
  assert.equal(component.state.biomeShift.to, "garden");
});

test("maps six feeds to bounded Garden animation values", () => {
  const animation = gardenAnimationState(feeds);
  assert.equal(animation.growthLevel, "branching");
  assert.equal(animation.growthScale, 1.0744);
  assert.equal(animation.adjacencySeconds, 14);
  assert.equal(animation.driftSeconds, 8.8);
  assert.equal(animation.pressureLevel, "moving");
  assert.equal(animation.biome, "garden");
  assert.equal(animation.signalMode, "pulse");
  assert.equal(GARDEN_FEED_CALIBRATION.smoothing.alpha, 0.12);
  assert.equal(lerp(20, 8, 0.5), 14);
});

test("smooths Garden numeric targets by twelve percent", () => {
  const previous = gardenAnimationState({});
  const target = gardenAnimationState(feeds);
  const smoothed = smoothGardenAnimation(previous, target);
  assert.equal(smoothed.biome, "garden");
  assert.ok(smoothed.growthScale > previous.growthScale);
  assert.ok(smoothed.growthScale < target.growthScale);
});

test("applies Garden calibration to stable SVG layers", () => {
  class Style {
    values = new Map();
    setProperty(name, value) { this.values.set(name, value); }
  }
  const node = () => ({ style: new Style(), dataset: {} });
  const elements = {
    growth: node(), adjacency: node(), driftCapture: node(), pressureSpread: node(),
    biomeShift: node(), environmentSignals: node()
  };
  applyGardenCalibration(feeds, elements);
  assert.equal(elements.growth.style.values.get("--garden-growth-scale"), "1.074");
  assert.equal(elements.adjacency.style.values.get("animation-duration"), "14.000s");
  assert.equal(elements.driftCapture.style.values.get("opacity"), "0.480");
  assert.equal(elements.pressureSpread.style.values.get("stroke-width"), "10.200px");
  assert.equal(elements.biomeShift.dataset.biome, "garden");
  assert.equal(elements.environmentSignals.dataset.signals, "pulse");
});

test("derives Garden environmental theme classes", () => {
  assert.deepEqual(gardenThemeClasses({
    growth: { stage: "branching" },
    pressureSpread: { intensity: 0.35 },
    biomeShift: { to: "garden" },
    environmentSignals: { active: ["germination"], warnings: [] }
  }), ["growth-branching", "pressure-moving", "biome-garden", "environment-speaking"]);
});