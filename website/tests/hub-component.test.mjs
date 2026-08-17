import assert from "node:assert/strict";
import test from "node:test";

import { ThresholdHubElement } from "../scripts/hub-component.js";

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