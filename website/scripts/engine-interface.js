const DEFAULT_ENDPOINT = "http://127.0.0.1:8000";

function normalizeEndpoint(endpoint) {
  return String(endpoint || DEFAULT_ENDPOINT).replace(/\/$/, "");
}

export function updateViewport(state, root = document.body) {
  root.dataset.engineSequence = String(state.sequence);
  root.dataset.engineConnected = "true";
  window.dispatchEvent(new CustomEvent("threshold:engine-state", { detail: state }));
  return state;
}

export function createEngineInterface({ endpoint = DEFAULT_ENDPOINT, root = document.body } = {}) {
  const baseUrl = normalizeEndpoint(endpoint);

  async function tick() {
    const response = await fetch(`${baseUrl}/tick`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Engine tick failed (${response.status})`);
    return updateViewport(await response.json(), root);
  }

  async function applyInput(nodeId, data) {
    const response = await fetch(`${baseUrl}/input/${encodeURIComponent(nodeId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Engine input failed (${response.status})`);
    return response.json();
  }

  return Object.freeze({ applyInput, endpoint: baseUrl, tick });
}