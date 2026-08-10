(function () {
  "use strict";

  const script = document.currentScript;
  const manifestUrl = script && script.dataset.manifest
    ? script.dataset.manifest
    : "config/spokes.json";
  let manifestPromise = null;
  let activeNode = null;

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(manifestUrl, { cache: "no-store" }).then(function (response) {
        if (!response.ok) {
          throw new Error("Spoke manifest unavailable (" + response.status + ")");
        }
        return response.json();
      });
    }
    return manifestPromise;
  }

  function findSpoke(manifest, spokeId) {
    return (manifest.spokes || []).find(function (spoke) {
      return spoke.id === spokeId;
    }) || null;
  }

  async function resolveSpoke(spokeId) {
    const manifest = await loadManifest();
    const spoke = findSpoke(manifest, spokeId);
    if (!spoke) {
      throw new Error("Unknown spoke: " + spokeId);
    }
    return spoke;
  }

  async function activate(options) {
    const spokeId = String(options && options.spokeId || "");
    const token = String(options && options.token || "");
    if (!spokeId || !token) {
      throw new Error("Node activation requires a spoke ID and token");
    }

    const manifest = await loadManifest();
    const spoke = findSpoke(manifest, spokeId);
    if (!spoke) {
      throw new Error("Unknown spoke: " + spokeId);
    }

    const endpoint = spoke.activationEndpoint || manifest.activationEndpoint;
    if (!endpoint) {
      throw new Error("No activation endpoint configured for " + spokeId);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        spoke: spokeId,
        activation: token,
        pulse: options && options.pulse ? options.pulse : null
      })
    });
    if (!response.ok) {
      let message = "Node activation failed (" + response.status + ")";
      try {
        const payload = await response.json();
        message = payload && payload.error ? String(payload.error) : message;
      } catch {
        // Keep the status-based fallback when the response is not JSON.
      }
      throw new Error(message);
    }

    const node = await response.json();
    activeNode = node;
    window.dispatchEvent(new CustomEvent("threshold:node-activated", {
      detail: { spoke: spoke, node: node }
    }));
    return node;
  }

  function release() {
    const released = activeNode;
    activeNode = null;
    window.dispatchEvent(new CustomEvent("threshold:node-released", {
      detail: { node: released }
    }));
  }

  window.ThresholdNodes = Object.freeze({
    activate: activate,
    getActiveNode: function () { return activeNode; },
    loadManifest: loadManifest,
    release: release,
    resolveSpoke: resolveSpoke
  });
})();
