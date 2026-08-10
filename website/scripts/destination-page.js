import {
  createLevelState,
  createNodePulse,
  crownLevel,
  navigateSettlingZone
} from "./fibonacci-routing.js";

const spokeId = document.body.dataset.thresholdSpoke || "";
const params = new URLSearchParams(location.search);
const nodeId = params.get("node");
const transitionKey = nodeId ? `threshold:page-transition:${spokeId}:${nodeId}` : "";
const topologyPromise = fetch("config/page-topology.json", { cache: "no-store" }).then((response) => {
  if (!response.ok) {
    throw new Error(`Page topology unavailable (${response.status})`);
  }
  return response.json();
});

function addStylesheet() {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "styles/destination-page.css";
  document.head.appendChild(stylesheet);
}

function createLayer() {
  const layer = document.createElement("section");
  const kicker = document.createElement("p");
  const title = document.createElement("h2");
  const content = document.createElement("div");
  const parent = document.createElement("nav");
  const children = document.createElement("nav");
  const status = document.createElement("p");

  layer.className = "threshold-destination-layer";
  layer.dataset.destinationLayer = "";
  kicker.className = "threshold-destination-kicker";
  kicker.textContent = "Connected layer";
  title.textContent = "Loading node...";
  content.className = "threshold-destination-content";
  parent.className = "threshold-destination-parent";
  parent.setAttribute("aria-label", "Parent page");
  children.className = "threshold-destination-children";
  children.setAttribute("aria-label", "Node children");
  status.className = "threshold-destination-status";
  status.setAttribute("role", "status");
  layer.append(kicker, title, content, parent, children, status);
  (document.querySelector("main") || document.body).appendChild(layer);
  return { layer, kicker, title, content, parent, children, status };
}

function summarize(node) {
  if (Array.isArray(node.components) && node.components.length) {
    return node.components.map((component) => {
      const value = component.content && (component.content.note || component.content);
      const text = value && (value.excerpt || value.body || value.title) || "";
      return `${String(component.type || "node").replace(/-/g, " ").toUpperCase()}\n${text}`;
    }).join("\n\n");
  }
  const value = node.content && (node.content.note || node.content);
  return typeof value === "string"
    ? value
    : value && (value.excerpt || value.body || value.title) || "";
}

function readTransition() {
  if (!transitionKey) {
    return null;
  }
  try {
    return JSON.parse(sessionStorage.getItem(transitionKey) || "null");
  } catch {
    return null;
  }
}

function routeTrail() {
  return (params.get("trail") || "").split(",").filter(Boolean);
}

function childDestination(choice) {
  const destination = new URL(location.href);
  const trail = routeTrail();
  const currentId = nodeId || spokeId;
  if (trail.at(-1) !== currentId) {
    trail.push(currentId);
  }
  destination.searchParams.set("node", String(choice.id));
  destination.searchParams.set("fib", String(choice.fib));
  destination.searchParams.set("trail", trail.join(","));
  return destination.pathname + destination.search;
}

function parentDestination(spoke, parentId, parentFib) {
  const destination = new URL(location.href);
  const trail = routeTrail();
  destination.searchParams.set("fib", String(parentFib));
  if (parentId === spoke.id) {
    destination.searchParams.delete("node");
    destination.searchParams.delete("trail");
  } else {
    destination.searchParams.set("node", parentId);
    destination.searchParams.set("trail", trail.slice(0, -1).join(","));
  }
  return destination.pathname + destination.search;
}

function createTransition(choice, fib, version) {
  const level = crownLevel(createLevelState({
    fib,
    versions: [version],
    version,
    fields: ["version", "choice", "shimmer", "stays"],
    required: ["version", "choice"],
    pass: ["version", "choice"],
    state: { choice: String(choice.id), shimmer: false, stays: 0 }
  }));
  const movement = navigateSettlingZone(level, "north");
  return {
    activation: choice.activation,
    pulse: createNodePulse(level, movement, "north")
  };
}

function localRoot(topology, spoke) {
  const root = topology.spokes[spoke.id] || { fib: 8, children: [] };
  return {
    id: spoke.id,
    label: spoke.label,
    fib: root.fib,
    parents: ["hub"],
    children: root.children.map((id) => localChild(topology, spoke.id, id))
  };
}

function localChild(topology, parentId, id) {
  const child = topology.nodes[id];
  return {
    id,
    ...child,
    fib: child.fibByParent?.[parentId] || child.fib
  };
}

function localNode(topology, id) {
  const node = topology.nodes[id];
  const parentId = routeTrail().at(-1) || node?.parents[0];
  return node && {
    id,
    ...node,
    fib: node.fibByParent?.[parentId] || node.fib,
    children: node.children.map((childId) => localChild(topology, id, childId))
  };
}

function mergeNode(local, remote) {
  if (!remote) {
    return local;
  }
  const remoteChildren = new Map((remote.children || []).map((child) => [child.id, child]));
  return {
    ...local,
    ...remote,
    content: remote.content || local.content,
    children: local.children.map((child) => ({ ...child, ...remoteChildren.get(child.id) }))
  };
}

function renderParent(view, topology, spoke, node) {
  view.parent.replaceChildren();
  if (node.id === spoke.id) {
    const hub = document.createElement("a");
    hub.className = "threshold-destination-parent-link";
    hub.href = "index.html";
    hub.textContent = "Move outward · Hub · Fib 13";
    view.parent.appendChild(hub);
    return;
  }
  const trail = routeTrail();
  const parentId = trail.at(-1) || node.parents[0];
  if (!node.parents.includes(parentId)) {
    throw new Error(`Parent ${parentId} is not declared for ${node.id}.`);
  }
  const parent = parentId === spoke.id ? topology.spokes[spoke.id] : topology.nodes[parentId];
  const link = document.createElement("a");
  link.className = "threshold-destination-parent-link";
  link.href = parentDestination(spoke, parentId, parent.fib);
  link.textContent = `Move outward · ${parentId === spoke.id ? spoke.label : parent.label} · Fib ${parent.fib}`;
  view.parent.appendChild(link);
}

function renderChildren(view, node, fib, version) {
  const children = Array.isArray(node.children) ? node.children : [];
  view.children.replaceChildren();
  children.forEach((choice) => {
    const link = document.createElement("a");
    const destination = childDestination(choice);
    link.className = "threshold-destination-child";
    link.href = destination;
    link.textContent = `Move inward · ${choice.label || String(choice.id).replace(/-/g, " ")} · Fib ${choice.fib}`;
    if (choice.activation) link.addEventListener("click", () => {
      const key = `threshold:page-transition:${spokeId}:${choice.id}`;
      sessionStorage.setItem(key, JSON.stringify(createTransition(choice, fib, version)));
    });
    view.children.appendChild(link);
  });
  view.status.textContent = children.length
    ? `${children.length} immediate ${children.length === 1 ? "child" : "children"} revealed.`
    : "This node has no declared children.";
}

function readFib() {
  const fib = Number(params.get("fib"));
  return [1, 2, 3, 5, 8, 13].includes(fib) ? fib : 8;
}

async function loadDestination() {
  if (!spokeId || !window.ThresholdNodes) {
    return;
  }
  addStylesheet();
  const view = createLayer();
  try {
    const [spoke, topology] = await Promise.all([
      window.ThresholdNodes.resolveSpoke(spokeId),
      topologyPromise
    ]);
    const grounded = nodeId ? localNode(topology, nodeId) : localRoot(topology, spoke);
    if (!grounded) {
      throw new Error("This page is not declared in the authored topology.");
    }
    const transition = readTransition();
    let activated = null;
    let activationError = null;
    if (!nodeId || transition) {
      try {
        activated = await window.ThresholdNodes.activate({
          spokeId,
          token: transition ? transition.activation : spoke.bootstrapActivation,
          pulse: transition ? transition.pulse : null
        });
      } catch (error) {
        activationError = error;
      }
    } else {
      activationError = new Error("private node enrichment requires a fresh parent transition");
    }
    const node = mergeNode(grounded, activated);
    const fib = node.fib || readFib();
    const version = params.get("version") || spokeId;
    view.layer.dataset.fib = String(fib);
    view.layer.dataset.complexity = topology.complexity[String(fib)] || "grounded";
    view.kicker.textContent = `Fib ${fib} · ${spoke.label}`;
    view.title.textContent = node.title || node.label || String(node.id || spoke.label).replace(/-/g, " ");
    view.content.textContent = summarize(node);
    renderParent(view, topology, spoke, node);
    renderChildren(view, node, fib, version);
    if (activationError) {
      view.status.textContent += ` Authored links remain available; ${activationError.message}`;
    }
  } catch (error) {
    view.title.textContent = "Node unavailable";
    view.status.textContent = error instanceof Error ? error.message : "Unable to reconstruct this node.";
  }
}

loadDestination();