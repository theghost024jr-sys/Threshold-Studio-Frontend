import {
  EngineContractError,
  assertAuthoritativeState,
  createNodeActivationIntent,
  createNodeInputIntent,
  rejectedIntent
} from "./engine-contract.js";

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000";

function normalizeEndpoint(endpoint) {
  return String(endpoint || DEFAULT_ENDPOINT).replace(/\/$/, "");
}

export function updateViewport(state, root = document.body) {
  assertAuthoritativeState(state);
  root.dataset.engineSequence = String(state.sequence);
  root.dataset.engineConnected = "true";
  window.dispatchEvent(new CustomEvent("threshold:engine-state", { detail: state }));
  return state;
}

export function createEngineInterface({ endpoint = DEFAULT_ENDPOINT, root = document.body } = {}) {
  const baseUrl = normalizeEndpoint(endpoint);

  function emitRejection(rejection) {
    window.dispatchEvent(new CustomEvent("threshold:engine-rejection", { detail: rejection }));
    return rejection;
  }

  function acceptIntent(intent, result) {
    const acceptance = Object.freeze({ type: "accepted", intent, result });
    window.dispatchEvent(new CustomEvent("threshold:engine-intent-accepted", { detail: acceptance }));
    return acceptance;
  }

  async function tick() {
    const response = await fetch(`${baseUrl}/tick`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Engine tick failed (${response.status})`);
    return updateViewport(await response.json(), root);
  }

  async function submitIntent(intent) {
    const response = await fetch(`${baseUrl}/input/${encodeURIComponent(intent.nodeId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(intent.payload)
    });
    if (!response.ok) {
      return emitRejection(rejectedIntent(
        intent,
        "engine-rejected",
        `Engine input failed (${response.status}).`,
        response.status
      ));
    }
    return acceptIntent(intent, await response.json());
  }

  async function applyInput(nodeId, data) {
    try {
      return await submitIntent(createNodeInputIntent(nodeId, data));
    } catch (error) {
      if (error instanceof EngineContractError) {
        return emitRejection(rejectedIntent(null, error.code, error.message, 400));
      }
      throw error;
    }
  }

  async function activateNode(nodeId, canonicalNodeIds) {
    try {
      return await submitIntent(createNodeActivationIntent(nodeId, canonicalNodeIds));
    } catch (error) {
      if (error instanceof EngineContractError) {
        return emitRejection(rejectedIntent(null, error.code, error.message, 400));
      }
      throw error;
    }
  }

  return Object.freeze({ activateNode, applyInput, endpoint: baseUrl, tick });
}