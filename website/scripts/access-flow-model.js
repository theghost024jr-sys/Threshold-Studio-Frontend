import {
  INVARIANT_FAILURE,
  requireContinuity,
  requireEarnedEffect,
  requireInvariant,
  requireResolvedEdge,
  requireSupportedClaim
} from "./invariant-kernel.js";

export const ACCESS_FLOW_VERSION = 3;

function transitionHistory(value) {
  return Array.isArray(value)
    ? value.filter((event) => event
      && typeof event.type === "string"
      && typeof event.stage === "string")
    : [];
}

function withTransition(state, type, stage) {
  return {
    ...state,
    history: [...state.history, { type, stage }]
  };
}

export function createAccessState(value = {}) {
  const completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((stage) => typeof stage === "string"))]
    : [];
  const shimmer = Boolean(value.shimmer);
  const seed = value.seed && typeof value.seed.chamber === "string"
    ? { chamber: value.seed.chamber }
    : null;
  const returnedSeeds = Array.isArray(value.returnedSeeds)
    ? [...new Set(value.returnedSeeds.filter((chamber) => typeof chamber === "string"))]
    : [];
  const history = transitionHistory(value.history);
  requireInvariant(
    !(seed && returnedSeeds.includes(seed.chamber)),
    INVARIANT_FAILURE.TRUTH_CONTRADICTION,
    `Seed from ${seed?.chamber} cannot be both carried and returned.`,
    { seed, returnedSeeds }
  );
  return { version: ACCESS_FLOW_VERSION, completed, shimmer, seed, returnedSeeds, history };
}

export function prerequisitesMet(stage, state) {
  const completed = new Set(createAccessState(state).completed);
  const normalized = createAccessState(state);
  return (stage.requires || []).every((required) => completed.has(required))
    && (!stage.requiresShimmer || normalized.shimmer);
}

export function completeStage(stage, state) {
  const normalized = createAccessState(state);
  if (!prerequisitesMet(stage, normalized)) {
    return normalized;
  }
  if (normalized.completed.includes(stage.id)) {
    return normalized;
  }
  return createAccessState({
    ...withTransition(normalized, "stage-completed", stage.id),
    completed: [...normalized.completed, stage.id],
    shimmer: normalized.shimmer || stage.awardsShimmer === true
  });
}

export function nextAvailableStage(stages, state) {
  const normalized = createAccessState(state);
  const completed = new Set(normalized.completed);
  return stages.find((stage) => !completed.has(stage.id) && prerequisitesMet(stage, normalized)) || null;
}

export function lockedRequirements(stage, state) {
  const normalized = createAccessState(state);
  const completed = new Set(normalized.completed);
  const missing = (stage.requires || []).filter((required) => !completed.has(required));
  return stage.requiresShimmer && !normalized.shimmer ? [...missing, "Shimmer"] : missing;
}

export function contribute(stage, state) {
  const normalized = createAccessState(state);
  requireEarnedEffect(
    stage.kind === "contribution",
    `${stage.id} is not a contribution chamber.`,
    { stage: stage.id, kind: stage.kind }
  );
  requireEarnedEffect(
    prerequisitesMet(stage, normalized),
    `${stage.id} is locked until its Shimmer condition is satisfied.`,
    { stage: stage.id, state: normalized }
  );
  if (normalized.seed || normalized.returnedSeeds.includes(stage.id)) {
    return normalized;
  }
  return createAccessState({
    ...withTransition(normalized, "seed-acquired", stage.id),
    completed: [...normalized.completed, stage.id],
    seed: { chamber: stage.id }
  });
}

export function returnSeedToHub(stage, state) {
  const normalized = createAccessState(state);
  requireEarnedEffect(
    stage.id === "hub",
    "Seeds may return only to the Hub.",
    { stage: stage.id }
  );
  if (!normalized.seed) {
    return normalized;
  }
  return createAccessState({
    ...withTransition(normalized, "seed-returned", normalized.seed.chamber),
    returnedSeeds: [...normalized.returnedSeeds, normalized.seed.chamber],
    seed: null
  });
}

export function validateAccessFlow(flow) {
  requireSupportedClaim(
    flow && Array.isArray(flow.stages) && Array.isArray(flow.registeredRoutes),
    "Access flow must declare stages and registered routes."
  );
  const ids = new Set();
  const routes = new Set(flow.registeredRoutes);
  flow.stages.forEach((stage) => {
    requireSupportedClaim(
      stage && typeof stage.id === "string" && !ids.has(stage.id),
      "Access flow stage identifiers must be unique strings.",
      { stage }
    );
    ids.add(stage.id);
    requireResolvedEdge(
      typeof stage.route === "string" && routes.has(stage.route.split("#", 1)[0]),
      `${stage.id} has no registered route.`,
      { stage: stage.id, route: stage.route }
    );
    requireEarnedEffect(
      stage.kind !== "contribution"
        || (stage.requiresShimmer === true && stage.completion === "action"),
      `${stage.id} contribution chamber must require Shimmer and an action.`,
      { stage: stage.id }
    );
  });
  flow.stages.forEach((stage) => {
    (stage.requires || []).forEach((required) => {
      requireSupportedClaim(
        ids.has(required),
        `${stage.id} requires undeclared stage ${required}.`,
        { stage: stage.id, required }
      );
    });
  });
  return flow;
}

export function validateAuthoritativeState(flow, state) {
  validateAccessFlow(flow);
  const normalized = createAccessState(state);
  const stages = new Map(flow.stages.map((stage) => [stage.id, stage]));
  const contributionStages = new Set(
    flow.stages.filter((stage) => stage.kind === "contribution").map((stage) => stage.id)
  );
  const awardedShimmer = flow.stages
    .filter((stage) => stage.awardsShimmer === true)
    .some((stage) => normalized.completed.includes(stage.id));

  normalized.completed.forEach((stage) => {
    requireSupportedClaim(stages.has(stage), `State completed undeclared stage ${stage}.`, { stage });
  });
  requireSupportedClaim(
    !normalized.shimmer || awardedShimmer,
    "State claims Shimmer without a completed Shimmer-awarding stage.",
    { completed: normalized.completed }
  );
  [normalized.seed?.chamber, ...normalized.returnedSeeds].filter(Boolean).forEach((chamber) => {
    requireSupportedClaim(
      contributionStages.has(chamber) && normalized.completed.includes(chamber),
      `State claims a Seed from unsupported contribution chamber ${chamber}.`,
      { chamber, completed: normalized.completed }
    );
  });
  if (normalized.history.length > 0) {
    const acquired = new Set(
      normalized.history.filter((event) => event.type === "seed-acquired").map((event) => event.stage)
    );
    const returned = new Set(
      normalized.history.filter((event) => event.type === "seed-returned").map((event) => event.stage)
    );
    normalized.returnedSeeds.forEach((chamber) => {
      requireContinuity(
        acquired.has(chamber) && returned.has(chamber),
        `Seed return for ${chamber} has no recorded acquisition and return lineage.`,
        { chamber, history: normalized.history }
      );
    });
    if (normalized.seed) {
      requireContinuity(
        acquired.has(normalized.seed.chamber),
        `Carried Seed from ${normalized.seed.chamber} has no recorded acquisition lineage.`,
        { chamber: normalized.seed.chamber, history: normalized.history }
      );
    }
  }
  return normalized;
}

export function classifyBranchTarget(stage, targetExists) {
  if (stage.endpoint === true) {
    return "endpoint";
  }
  requireResolvedEdge(
    targetExists,
    `${stage.id} has no viable next branch.`,
    { stage: stage.id }
  );
  return "branch";
}