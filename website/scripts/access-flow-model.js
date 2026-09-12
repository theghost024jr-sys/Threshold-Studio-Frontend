export const ACCESS_FLOW_VERSION = 1;

export function createAccessState(value = {}) {
  const completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((stage) => typeof stage === "string"))]
    : [];
  return { version: ACCESS_FLOW_VERSION, completed };
}

export function prerequisitesMet(stage, state) {
  const completed = new Set(createAccessState(state).completed);
  return (stage.requires || []).every((required) => completed.has(required));
}

export function completeStage(stage, state) {
  const normalized = createAccessState(state);
  if (!prerequisitesMet(stage, normalized)) {
    return normalized;
  }
  return createAccessState({ completed: [...normalized.completed, stage.id] });
}

export function nextAvailableStage(stages, state) {
  const normalized = createAccessState(state);
  const completed = new Set(normalized.completed);
  return stages.find((stage) => !completed.has(stage.id) && prerequisitesMet(stage, normalized)) || null;
}

export function lockedRequirements(stage, state) {
  const completed = new Set(createAccessState(state).completed);
  return (stage.requires || []).filter((required) => !completed.has(required));
}