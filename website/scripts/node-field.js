import { createEngineInterface } from "./engine-interface.js";
import { createNodeFieldLayout } from "./node-field-placement.js";

const field = document.querySelector("[data-node-field-nodes]");
const space = document.querySelector("[data-node-field-space]");
const loading = document.querySelector("[data-node-field-loading]");
const reading = document.querySelector("[data-node-field-reading]");
const title = document.querySelector("#node-field-reading-title");
const detail = document.querySelector("[data-node-field-detail]");
const contact = document.querySelector("[data-node-field-contact]");
const status = document.querySelector("[data-node-field-status]");
const endpoint = document.body.dataset.engineEndpoint;
let approachedNode = null;
let engineInterface = null;
let nodeControls = new Map();
let nodePositions = new Map();

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
  const connections = Array.isArray(node.connections) ? node.connections.length : 0;
  return `${node.type || "node"} · ${connections} existing connection${connections === 1 ? "" : "s"}`;
}

function renderReading(node) {
  approachedNode = node;
  title.textContent = node.id;
  detail.textContent = describeNode(node);
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
}

function renderNodes(nodes) {
  field.replaceChildren();
  nodeControls = new Map();
  nodePositions = new Map();
  createNodeFieldLayout(nodes).forEach((position) => nodePositions.set(position.nodeId, {
    ...position,
    x: 50 + position.x * 50,
    y: 50 + position.y * 50
  }));
  nodes.forEach((node) => {
    const control = document.createElement("button");
    const position = nodePositions.get(node.id);
    control.type = "button";
    control.className = "node-field-node";
    control.dataset.nodeId = node.id;
    control.dataset.nodeLabel = node.id;
    control.style.setProperty("--node-x", `${position.x}%`);
    control.style.setProperty("--node-y", `${position.y}%`);
    control.style.setProperty("--node-z", `${position.z}`);
    control.style.zIndex = `${Math.round(position.z * 100)}`;
    control.style.setProperty("--node-scale", `${position.scale}`);
    control.style.setProperty("--node-opacity", `${position.opacity}`);
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
