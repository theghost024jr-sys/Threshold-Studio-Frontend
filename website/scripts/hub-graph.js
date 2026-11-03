const graph = document.querySelector(".entry-nav");
const canvas = document.querySelector("[data-hub-graph-canvas]");
const hubNode = document.querySelector("[data-hub-wheel]");
const vaultEvidence = document.querySelector("[data-hub-vault-evidence]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const relevantVaultDocumentIds = new Set([
  "housegarden",
  "herbroom",
  "herbroom-threshold-east",
  "basin",
  "old-forest",
]);

if (graph && canvas && hubNode && vaultEvidence) {
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let scale = 1;
  let documents = [];
  const revealedDocumentIds = new Set();
  let accessState = null;

  const render = () => {
    frame = 0;
    canvas.style.setProperty("--graph-x", pointerX.toFixed(3));
    canvas.style.setProperty("--graph-y", pointerY.toFixed(3));
    canvas.style.setProperty("--graph-scale", scale.toFixed(3));
  };

  const scheduleRender = () => {
    if (!frame) frame = window.requestAnimationFrame(render);
  };

  const centerInGraph = (bounds) => {
    const hubBounds = hubNode.getBoundingClientRect();
    return {
      x: hubBounds.left + hubBounds.width / 2 - bounds.left,
      y: hubBounds.top + hubBounds.height / 2 - bounds.top,
    };
  };

  const positionVaultEvidence = () => {
    const bounds = graph.getBoundingClientRect();
    const center = centerInGraph(bounds);
    const fieldRadius = Math.min(bounds.width, bounds.height);

    vaultEvidence.querySelectorAll("[data-vault-evidence]").forEach((node, index) => {
      const angle = index * 2.399963229728653;
      const ring = 0.42 + (index % 4) * 0.11;
      const radius = fieldRadius * ring;
      node.style.left = `${(center.x + Math.cos(angle) * radius).toFixed(1)}px`;
      node.style.top = `${(center.y + Math.sin(angle) * radius).toFixed(1)}px`;
    });

    const seed = vaultEvidence.querySelector("[data-hub-seed-evidence]");
    if (seed) {
      seed.style.left = `${(center.x + fieldRadius * 0.22).toFixed(1)}px`;
      seed.style.top = `${(center.y - fieldRadius * 0.18).toFixed(1)}px`;
    }
  };

  const syncThreads = () => {
    const graphBounds = graph.getBoundingClientRect();
    const hubBounds = hubNode.getBoundingClientRect();
    const hubX = (hubBounds.left + hubBounds.width / 2 - graphBounds.left) / graphBounds.width * 100;
    const hubY = (hubBounds.top + hubBounds.height / 2 - graphBounds.top) / graphBounds.height * 100;

    graph.querySelectorAll("[data-graph-link]").forEach((thread) => {
      const route = graph.querySelector(`[data-graph-node="${thread.dataset.graphLink}"]`);
      if (!route || route.hidden) return;

      const routeBounds = route.getBoundingClientRect();
      thread.setAttribute("x1", hubX.toFixed(2));
      thread.setAttribute("y1", hubY.toFixed(2));
      thread.setAttribute("x2", ((routeBounds.left + routeBounds.width / 2 - graphBounds.left) / graphBounds.width * 100).toFixed(2));
      thread.setAttribute("y2", ((routeBounds.top + routeBounds.height / 2 - graphBounds.top) / graphBounds.height * 100).toFixed(2));
    });
  };

  const renderSeedEvidence = (state) => {
    accessState = state;
    vaultEvidence.querySelector("[data-hub-seed-evidence]")?.remove();
    const chamber = state?.seed?.chamber || state?.returnedSeeds?.at(-1);
    if (!chamber) return;

    const seed = document.createElement("li");
    seed.className = "hub-vault-evidence__node hub-vault-evidence__seed";
    seed.dataset.hubSeedEvidence = "";
    seed.tabIndex = 0;
    seed.setAttribute(
      "aria-label",
      state.seed
        ? `Seed from ${chamber} carried toward the Hub`
        : `Seed from ${chamber} returned to the Hub and awaiting validation`
    );
    seed.title = seed.getAttribute("aria-label");
    vaultEvidence.append(seed);
    positionVaultEvidence();
  };

  const renderVaultEvidence = (vault) => {
    documents = Array.isArray(vault.documents) ? vault.documents : [];
    vaultEvidence.querySelectorAll("[data-vault-evidence]").forEach((node) => node.remove());

    documents
      .filter((vaultDocument) =>
        relevantVaultDocumentIds.has(vaultDocument.id)
        || revealedDocumentIds.has(vaultDocument.id)
      )
      .forEach((vaultDocument) => {
      const evidence = document.createElement("li");
      evidence.className = "hub-vault-evidence__node";
      evidence.dataset.vaultEvidence = vaultDocument.id;
      evidence.tabIndex = 0;
      evidence.setAttribute("aria-label", `${vaultDocument.title} · published vault evidence`);
      evidence.title = `${vaultDocument.title} · ${vaultDocument.relativePath}`;
      vaultEvidence.append(evidence);
    });

    positionVaultEvidence();
    renderSeedEvidence(accessState);
  };

  const loadVaultEvidence = async () => {
    try {
      const response = await fetch("/data/threshold-vault.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Published vault unavailable (${response.status})`);
      renderVaultEvidence(await response.json());
    } catch (error) {
      console.error("Threshold Hub could not load published vault evidence.", error);
    }
  };

  syncThreads();
  loadVaultEvidence();
  window.addEventListener("resize", () => {
    syncThreads();
    positionVaultEvidence();
  });
  window.addEventListener("threshold:access-flow-ready", (event) => {
    renderSeedEvidence(event.detail?.state || null);
  });
  window.addEventListener("threshold:hub-vault-evidence-revealed", (event) => {
    const documentIds = Array.isArray(event.detail?.documentIds) ? event.detail.documentIds : [];
    documentIds.forEach((documentId) => revealedDocumentIds.add(documentId));
    renderVaultEvidence({ documents });
  });

  if (!reducedMotion.matches) {
    graph.addEventListener("pointermove", (event) => {
      const bounds = graph.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      scheduleRender();
    });

    graph.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
      scheduleRender();
    });

    graph.addEventListener("wheel", (event) => {
      if (event.target.closest("[data-hub-wheel]") || window.innerWidth <= 900) return;

      event.preventDefault();
      scale = Math.min(1.08, Math.max(0.94, scale - event.deltaY * 0.0004));
      scheduleRender();
    }, { passive: false });
  }
}
