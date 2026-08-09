import { createInitialEngineStateFromDom, createStateStore } from "./engine/state-store.js";
import { createInteractionController } from "./engine/interaction-controller.js";

const store = createStateStore(createInitialEngineStateFromDom());

const bridge = {
  store,
  createInteractionController,
  version: "engine-0.1",
};

window.__thresholdEngine = bridge;

// Phase-2 bridge: keep current behavior by loading the legacy monolith.
await import("./hub-choice.js?v=20260807l");
