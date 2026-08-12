import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceHubActivation,
  createHubActivationState,
  evaluateHubPrerequisites,
  HUB_ACTIVATION_STAGES,
  HUB_RESONANCE_HOLD_MS
} from "../scripts/hub-activation.js";

const activeEvidence = {
  participantPresence: 1,
  signalCoherence: 0.82,
  assetProximity: 1,
  temporalAlignment: true
};

test("normalizes the five Hub activation prerequisites", () => {
  assert.deepEqual(evaluateHubPrerequisites({
    participantPresence: 2,
    signalCoherence: 0.6,
    counterConditions: [null, "inversion"]
  }), {
    participantPresence: 1,
    signalCoherence: 0.6,
    assetProximity: 1,
    temporalAlignment: true,
    counterConditions: ["inversion"],
    aware: true,
    active: false
  });
});

test("moves from Dormant through Aware to Active as prerequisites form", () => {
  const dormant = createHubActivationState(0);
  const aware = advanceHubActivation(dormant, {
    observedAt: 100,
    participantPresence: 0.25,
    signalCoherence: 0.2
  });
  const active = advanceHubActivation(aware, { observedAt: 200, ...activeEvidence });

  assert.equal(aware.stage, HUB_ACTIVATION_STAGES.AWARE);
  assert.equal(active.stage, HUB_ACTIVATION_STAGES.ACTIVE);
  assert.equal(active.activeSince, 200);
});

test("requires sustained high coherence before Resonant", () => {
  const active = advanceHubActivation(createHubActivationState(0), {
    observedAt: 100,
    ...activeEvidence
  });
  const early = advanceHubActivation(active, {
    observedAt: 100 + HUB_RESONANCE_HOLD_MS - 1,
    ...activeEvidence
  });
  const resonant = advanceHubActivation(early, {
    observedAt: 100 + HUB_RESONANCE_HOLD_MS,
    ...activeEvidence
  });

  assert.equal(early.stage, HUB_ACTIVATION_STAGES.ACTIVE);
  assert.equal(resonant.stage, HUB_ACTIVATION_STAGES.RESONANT);
});

test("does not enter Transcendent without explicit authorization", () => {
  const resonant = {
    ...createHubActivationState(0),
    stage: HUB_ACTIVATION_STAGES.RESONANT,
    activeSince: 0
  };
  const ordinary = advanceHubActivation(resonant, { observedAt: 3000, ...activeEvidence });
  const transcendent = advanceHubActivation(ordinary, {
    observedAt: 3100,
    ...activeEvidence,
    transcendenceAuthorized: true
  });

  assert.equal(ordinary.stage, HUB_ACTIVATION_STAGES.RESONANT);
  assert.equal(transcendent.stage, HUB_ACTIVATION_STAGES.TRANSCENDENT);
});

test("treats Failed as an explicit latched exception until reset", () => {
  const active = advanceHubActivation(createHubActivationState(0), {
    observedAt: 100,
    ...activeEvidence
  });
  const failed = advanceHubActivation(active, {
    observedAt: 200,
    failureReason: "resonance-collapse"
  });
  const latched = advanceHubActivation(failed, { observedAt: 300, ...activeEvidence });
  const reset = advanceHubActivation(latched, { observedAt: 400, reset: true });

  assert.equal(failed.stage, HUB_ACTIVATION_STAGES.FAILED);
  assert.equal(latched.stage, HUB_ACTIVATION_STAGES.FAILED);
  assert.equal(reset.stage, HUB_ACTIVATION_STAGES.DORMANT);
});

test("ordinary prerequisite loss returns through Aware or Dormant, not Failed", () => {
  const active = advanceHubActivation(createHubActivationState(0), {
    observedAt: 100,
    ...activeEvidence
  });
  const blocked = advanceHubActivation(active, {
    observedAt: 200,
    participantPresence: 1,
    signalCoherence: 0.7,
    counterConditions: ["the-pale"]
  });
  const dormant = advanceHubActivation(blocked, { observedAt: 300 });

  assert.equal(blocked.stage, HUB_ACTIVATION_STAGES.AWARE);
  assert.equal(blocked.reason, "counter-condition");
  assert.equal(dormant.stage, HUB_ACTIVATION_STAGES.DORMANT);
});
