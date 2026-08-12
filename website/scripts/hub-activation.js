export const HUB_ACTIVATION_STAGES = Object.freeze({
  DORMANT: "dormant",
  AWARE: "aware",
  ACTIVE: "active",
  RESONANT: "resonant",
  TRANSCENDENT: "transcendent",
  FAILED: "failed"
});

export const HUB_RESONANCE_HOLD_MS = 2400;

function clamp(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

export function createHubActivationState(startedAt = 0) {
  return {
    stage: HUB_ACTIVATION_STAGES.DORMANT,
    previousStage: null,
    changedAt: startedAt,
    updatedAt: startedAt,
    activeSince: null,
    reason: "awaiting-presence"
  };
}

export function evaluateHubPrerequisites(evidence = {}) {
  const participantPresence = clamp(evidence.participantPresence);
  const signalCoherence = clamp(evidence.signalCoherence);
  const assetProximity = evidence.assetProximity === undefined
    ? 1
    : clamp(evidence.assetProximity);
  const temporalAlignment = evidence.temporalAlignment !== false;
  const counterConditions = Array.isArray(evidence.counterConditions)
    ? evidence.counterConditions.filter(Boolean)
    : [];
  const aware = participantPresence > 0 || signalCoherence > 0;
  const active = participantPresence >= 0.5
    && signalCoherence >= 0.55
    && assetProximity >= 0.5
    && temporalAlignment
    && counterConditions.length === 0;

  return {
    participantPresence,
    signalCoherence,
    assetProximity,
    temporalAlignment,
    counterConditions,
    aware,
    active
  };
}

export function advanceHubActivation(state, evidence = {}) {
  const observedAt = Number.isFinite(evidence.observedAt)
    ? evidence.observedAt
    : state.updatedAt;
  const prerequisites = evaluateHubPrerequisites(evidence);
  let stage = state.stage;
  let activeSince = state.activeSince;
  let reason = state.reason;

  if (evidence.reset) {
    stage = HUB_ACTIVATION_STAGES.DORMANT;
    activeSince = null;
    reason = "reset";
  } else if (evidence.failureReason) {
    stage = HUB_ACTIVATION_STAGES.FAILED;
    activeSince = null;
    reason = evidence.failureReason;
  } else if (state.stage === HUB_ACTIVATION_STAGES.FAILED) {
    reason = state.reason;
  } else if (
    state.stage === HUB_ACTIVATION_STAGES.TRANSCENDENT
    || state.stage === HUB_ACTIVATION_STAGES.RESONANT && evidence.transcendenceAuthorized
  ) {
    stage = HUB_ACTIVATION_STAGES.TRANSCENDENT;
    reason = evidence.transcendenceAuthorized ? "transcendence-authorized" : state.reason;
  } else if (!prerequisites.aware) {
    stage = HUB_ACTIVATION_STAGES.DORMANT;
    activeSince = null;
    reason = "awaiting-presence";
  } else if (!prerequisites.active) {
    stage = HUB_ACTIVATION_STAGES.AWARE;
    activeSince = null;
    reason = prerequisites.counterConditions.length > 0
      ? "counter-condition"
      : "prerequisites-forming";
  } else {
    activeSince ??= observedAt;
    const sustained = observedAt - activeSince >= HUB_RESONANCE_HOLD_MS;
    if (sustained && prerequisites.signalCoherence >= 0.78) {
      stage = HUB_ACTIVATION_STAGES.RESONANT;
      reason = "sustained-coherence";
    } else {
      stage = HUB_ACTIVATION_STAGES.ACTIVE;
      reason = "prerequisites-met";
    }
  }

  const changed = stage !== state.stage;
  return {
    stage,
    previousStage: changed ? state.stage : state.previousStage,
    changedAt: changed ? observedAt : state.changedAt,
    updatedAt: observedAt,
    activeSince,
    reason,
    prerequisites
  };
}
