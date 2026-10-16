const AUTHORITY_FIELDS = new Set([
  "active",
  "chambers",
  "click",
  "collapse",
  "drift",
  "migration",
  "resonance",
  "threshold",
  "thresholds",
  "tint",
  "volatility",
  "worldState",
  "worldstate"
]);

export class EngineContractError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "EngineContractError";
    this.code = code;
  }
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertSafeIntentValue(value, path = "payload") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeIntentValue(item, `${path}[${index}]`));
    return;
  }
  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (AUTHORITY_FIELDS.has(key)) {
      throw new EngineContractError(
        "authoritative-field",
        `Frontend intent must not include authoritative field "${path}.${key}".`
      );
    }
    assertSafeIntentValue(child, `${path}.${key}`);
  });
}

export function createNodeInputIntent(nodeId, payload) {
  if (typeof nodeId !== "string" || !/^[A-Za-z0-9._-]+$/.test(nodeId)) {
    throw new EngineContractError("invalid-node-id", "A node intent requires a valid node identifier.");
  }
  if (!isRecord(payload)) {
    throw new EngineContractError("invalid-payload", "A node intent payload must be an object.");
  }
  assertSafeIntentValue(payload);
  if (Object.keys(payload).length !== 1 || payload.action !== "select") {
    throw new EngineContractError("unsupported-intent", "The only supported node input payload is { action: \"select\" }.");
  }
  return Object.freeze({
    type: "node.input",
    nodeId,
    payload: Object.freeze({ action: "select" })
  });
}

export function createNodeActivationIntent(nodeId, canonicalNodeIds) {
  if (typeof nodeId !== "string" || !/^[A-Za-z0-9._-]+$/.test(nodeId)) {
    throw new EngineContractError("invalid-node-id", "A node activation requires a valid node identifier.");
  }
  if (!canonicalNodeIds || typeof canonicalNodeIds.has !== "function") {
    throw new EngineContractError("invalid-canonical-registry", "Node activation requires a canonical node registry.");
  }
  if (!canonicalNodeIds.has(nodeId)) {
    throw new EngineContractError("unknown-canonical-node", `Node "${nodeId}" is not canonical.`);
  }

  return Object.freeze({
    type: "node.activate",
    nodeId,
    payload: Object.freeze({ type: "node.activate" })
  });
}

export function assertAuthoritativeState(state) {
  if (!isRecord(state)) {
    throw new EngineContractError("invalid-state", "The engine must return an authoritative state object.");
  }
  if (!Number.isInteger(state.sequence) || state.sequence < 0) {
    throw new EngineContractError("invalid-state", "The engine state must contain a non-negative integer sequence.");
  }
  return state;
}

export function rejectedIntent(intent, code, message, status) {
  return Object.freeze({
    type: "rejected",
    intent,
    code,
    message,
    status
  });
}
