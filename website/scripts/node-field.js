import { createEngineInterface } from "./engine-interface.js";
import { createNodeFieldLayout } from "./node-field-placement.js";

const field = document.querySelector("[data-node-field-nodes]");
const space = document.querySelector("[data-node-field-space]");
const loading = document.querySelector("[data-node-field-loading]");
const links = document.querySelector("[data-node-field-links]");
const reading = document.querySelector("[data-node-field-reading]");
const title = document.querySelector("#node-field-reading-title");
const detail = document.querySelector("[data-node-field-detail]");
const contact = document.querySelector("[data-node-field-contact]");
const status = document.querySelector("[data-node-field-status]");
const vaultReading = document.querySelector("[data-node-field-vault]");
const vaultTitle = document.querySelector("[data-node-field-vault-title]");
const vaultSummary = document.querySelector("[data-node-field-vault-summary]");
const vaultFacets = document.querySelector("[data-node-field-vault-facets]");
const vaultSource = document.querySelector("[data-node-field-vault-source]");
const endpoint = document.body.dataset.engineEndpoint;
let approachedNode = null;
let engineInterface = null;
let nodeControls = new Map();
let nodePositions = new Map();
let fieldConnections = new Map();

const THEGHOST_NODE_EXTENSIONS = Object.freeze({
  basin: Object.freeze({
    title: "Basin / pressure surface",
    summary: "A vessel of stone and water where containment makes load, timing, and change perceptible.",
    facets: Object.freeze([
      Object.freeze(["Field", "weight · containment · slow accumulation"]),
      Object.freeze(["Surface", "stillwater · echo bowl · sediment memory"]),
      Object.freeze(["Pulse", "chamber deltas · drift pressure · anchor formation"]),
      Object.freeze(["Activity", "collapse onset · bundle activation · frontier stress"])
    ]),
    source: "theghost vault: Stone Basin · Basin Pulse · Basin Heatmap · Drift Metrics"
  })
});

function moveFocus(currentNodeId, direction) {
  const current = nodePositions.get(currentNodeId);
  const directionVector = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }
  }[direction];
  if (!directionVector) return;

  const next = [...nodePositions.entries()]
    .filter(([id]) => id !== currentNodeId)
    .map(([id, position]) => {
      const deltaX = position.x - current.x;
      const deltaY = position.y - current.y;
      const distance = Math.hypot(deltaX, deltaY);
      const alignment = (deltaX * directionVector.x + deltaY * directionVector.y) / distance;
      return { id, alignment, distance };
    })
    .filter((candidate) => candidate.alignment > 0.2)
    .sort((left, right) => (right.alignment / left.distance) - (left.alignment / right.distance))[0];
  nodeControls.get(next?.id)?.focus();
}

function describeNode(node) {
  const connections = fieldConnections.get(node.id)?.size || 0;
  return `${node.type || "node"} · ${connections} existing connection${connections === 1 ? "" : "s"}`;
}

function getVaultDocuments() {
  const documents = window.threshold?.vault?.documents;
  return Array.isArray(documents) ? documents : [];
}

function findVaultDocument(node) {
  return getVaultDocuments().find((document) => document.id === node.id) || null;
}

function documentSummary(document) {
  const lines = String(document?.body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("!["));
  return lines[0] || document?.description || "No authored reading is available for this node.";
}

function buildFieldConnections(nodes) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const documents = new Map(getVaultDocuments().map((document) => [document.id, document]));
  const connections = new Map(nodes.map((node) => [node.id, new Set()]));

  nodes.forEach((node) => {
    const document = documents.get(node.id);
    const linkedIds = [
      ...(Array.isArray(node.connections) ? node.connections : []),
      ...(Array.isArray(document?.connections) ? document.connections : []),
      ...(Array.isArray(document?.entries) ? document.entries : []),
      ...(Array.isArray(document?.exits) ? document.exits : []),
      ...(Array.isArray(document?.neighbors) ? document.neighbors : [])
    ];
    linkedIds.forEach((id) => {
      if (!nodeIds.has(id) || id === node.id) return;
      connections.get(node.id).add(id);
      connections.get(id).add(node.id);
    });
  });

  return connections;
}

function renderConnections() {
  links.replaceChildren();
  const drawn = new Set();
  fieldConnections.forEach((connectedIds, nodeId) => {
    const start = nodePositions.get(nodeId);
    connectedIds.forEach((targetId) => {
      const end = nodePositions.get(targetId);
      const key = [nodeId, targetId].sort().join(":");
      if (!start || !end || drawn.has(key)) return;
      drawn.add(key);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.classList.add("node-field-link");
      line.dataset.nodeStart = nodeId;
      line.dataset.nodeEnd = targetId;
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      links.appendChild(line);
    });
  });
}

function setConnectedLinks(nodeId) {
  links.querySelectorAll(".node-field-link").forEach((line) => {
    line.classList.toggle(
      "is-connected",
      line.dataset.nodeStart === nodeId || line.dataset.nodeEnd === nodeId
    );
  });
}

function renderVaultReading(node) {
  const extension = THEGHOST_NODE_EXTENSIONS[node.id];
  const publishedDocument = findVaultDocument(node);
  if (!extension && !publishedDocument) {
    vaultReading.hidden = true;
    vaultFacets.replaceChildren();
    return;
  }

  vaultReading.hidden = false;
  vaultTitle.textContent = extension?.title || publishedDocument.title;
  vaultSummary.textContent = extension?.summary || documentSummary(publishedDocument);
  vaultFacets.replaceChildren();
  const facets = extension?.facets || [
    ["Kind", publishedDocument.kind || node.type || "node"],
    ["Route", publishedDocument.route || publishedDocument.html || "No page route"],
    ["Connections", String(fieldConnections.get(node.id)?.size || 0)]
  ];
  facets.forEach(([label, value]) => {
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    definition.textContent = value;
    vaultFacets.append(term, definition);
  });
  vaultSource.textContent = extension
    ? `${extension.source}${publishedDocument ? ` · published node: ${publishedDocument.title}` : ""}`
    : `published vault: ${publishedDocument.relativePath}`;
}

function renderReading(node) {
  approachedNode = node;
  const extension = THEGHOST_NODE_EXTENSIONS[node.id];
  const publishedDocument = findVaultDocument(node);
  title.textContent = extension?.title || publishedDocument?.title || node.id;
  detail.textContent = extension?.summary || documentSummary(publishedDocument);
  renderVaultReading(node);
  setConnectedLinks(node.id);
  if (engineInterface) {
    contact.disabled = false;
    contact.textContent = "Make contact";
    status.textContent = "Contact submits the existing select intent.";
  } else {
    contact.disabled = true;
    contact.textContent = "Contact unavailable";
    status.textContent = "Engine contact is not configured.";
  }
}

function settleField() {
  space.classList.remove("is-approaching");
  field.querySelectorAll(".is-approached").forEach((item) => item.classList.remove("is-approached"));
  setConnectedLinks("");
}

function renderNodes(nodes) {
  field.replaceChildren();
  nodeControls = new Map();
  nodePositions = new Map();
  createNodeFieldLayout(nodes).forEach((anchor) => nodePositions.set(anchor.nodeId, {
    anchor,
    x: 50 + anchor.x * 45,
    y: 50 + anchor.y * 42
  }));
  fieldConnections = buildFieldConnections(nodes);
  renderConnections();
  nodes.forEach((node) => {
    const control = document.createElement("button");
    const position = nodePositions.get(node.id);
    control.type = "button";
    control.className = "node-field-node";
    control.dataset.nodeId = node.id;
    control.dataset.nodeLabel = node.id;
    control.dataset.nodeType = node.type;
    control.classList.toggle("is-basin-node", node.id === "basin");
    control.style.setProperty("--node-x", `${position.anchor.x}`);
    control.style.setProperty("--node-y", `${position.anchor.y}`);
    control.style.setProperty("--node-z", `${position.anchor.z}`);
    control.style.zIndex = `${Math.round(position.anchor.z * 100)}`;
    control.style.setProperty("--node-scale", `${position.anchor.scale}`);
    control.style.setProperty("--node-opacity", `${position.anchor.opacity}`);
    control.setAttribute("aria-label", `${node.id}, ${describeNode(node)}`);
    const approach = () => {
      field.querySelectorAll(".is-approached").forEach((item) => item.classList.remove("is-approached"));
      control.classList.add("is-approached");
      renderReading(node);
    };
    control.addEventListener("pointerenter", () => {
      if (!field.contains(document.activeElement)) approach();
    });
    control.addEventListener("focus", approach);
    control.addEventListener("click", approach);
    control.addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        moveFocus(node.id, event.key);
      }
    });
    field.appendChild(control);
    nodeControls.set(node.id, control);
  });
  loading.hidden = true;
}

async function submitContact() {
  if (!approachedNode || !engineInterface) return;
  contact.disabled = true;
  const control = nodeControls.get(approachedNode.id);
  control?.classList.remove("is-responded", "is-rejected", "is-unchanged");
  control?.classList.add("is-contacting");
  status.textContent = "Contact submitted. Awaiting engine response.";
  try {
    const result = await engineInterface.applyInput(approachedNode.id, { action: "select" });
    const state = await engineInterface.tick();
    const nodeState = state.nodes?.[approachedNode.id];
    if (result.type === "rejected") {
      control?.classList.add("is-rejected");
      status.textContent = "Engine rejected contact.";
    } else if (result.responded) {
      control?.classList.add("is-responded");
      status.textContent = `Node responded. Input count ${nodeState?.inputCount ?? 0}.`;
    } else {
      control?.classList.add("is-unchanged");
      status.textContent = "Recorded. The node did not change.";
    }
  } catch (error) {
    control?.classList.add("is-rejected");
    status.textContent = `Engine contact unavailable: ${error.message}`;
  } finally {
    control?.classList.remove("is-contacting");
    contact.disabled = !engineInterface;
  }
}

async function initialize() {
  const engine = window.threshold;
  if (!engine) throw new Error("Node registry unavailable.");
  await engine.boot();
  if (endpoint) engineInterface = createEngineInterface({ endpoint, root: document.body });
  const nodes = engine.nodeRegistry?.list() || [];
  if (nodes.length === 0) throw new Error("No nodes are available.");
  renderNodes(nodes);
}

contact.addEventListener("click", submitContact);
space.addEventListener("pointerleave", () => {
  if (!space.contains(document.activeElement)) settleField();
});
space.addEventListener("focusout", () => {
  requestAnimationFrame(() => {
    if (!space.contains(document.activeElement) && !space.matches(":hover")) settleField();
  });
});
initialize().catch((error) => {
  loading.textContent = error.message;
  status.textContent = "The field is unavailable.";
});
