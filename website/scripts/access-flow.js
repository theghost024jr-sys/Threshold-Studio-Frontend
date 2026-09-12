import {
  completeStage,
  createAccessState,
  lockedRequirements,
  prerequisitesMet
} from "./access-flow-model.js";

const FLOW_URL = "/config/access-flow.json";

function normalizedPath() {
  return location.pathname === "/" ? "/index.html" : location.pathname;
}

function stageForLocation(stages) {
  const path = normalizedPath();
  const hash = location.hash;
  return stages.find((stage) => {
    const [routePath, routeHash = ""] = stage.route.split("#");
    return path === routePath && (!routeHash || hash === `#${routeHash}`);
  }) || null;
}

function readState(storageKey) {
  try {
    return createAccessState(JSON.parse(localStorage.getItem(storageKey) || "{}"));
  } catch {
    return createAccessState();
  }
}

function writeState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The flow remains navigable when browser storage is unavailable.
  }
}

function addStylesheet() {
  if (document.querySelector('link[href="/styles/access-flow.css"]')) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/styles/access-flow.css";
  document.head.appendChild(stylesheet);
}

function projectForPage(projects) {
  const path = normalizedPath();
  return projects.find((project) => project.route === path) || null;
}

function renderRail(flow, state) {
  document.querySelector("[data-access-flow]")?.remove();
  const project = projectForPage(flow.projects);
  const rail = document.createElement("aside");
  rail.className = "threshold-access-flow";
  rail.dataset.accessFlow = "";
  rail.setAttribute("aria-label", "Threshold access flow");

  const heading = document.createElement("div");
  heading.className = "threshold-access-flow__heading";
  heading.innerHTML = `<strong>${project ? `${project.label} Chamber` : "Threshold Graft"}</strong><span>${state.completed.length}/${flow.stages.length} passages</span>`;

  const steps = document.createElement("ol");
  steps.className = "threshold-access-flow__steps";
  const completed = new Set(state.completed);
  flow.stages.forEach((stage) => {
    const item = document.createElement("li");
    const unlocked = prerequisitesMet(stage, state);
    const control = document.createElement(unlocked ? "a" : "span");
    control.textContent = stage.label;
    control.dataset.state = completed.has(stage.id) ? "complete" : unlocked ? "available" : "locked";
    if (unlocked) control.href = stage.route;
    if (!unlocked) control.title = `Requires ${lockedRequirements(stage, state).join(", ")}`;
    item.appendChild(control);
    steps.appendChild(item);
  });

  rail.append(heading, steps);
  document.body.appendChild(rail);
}

function renderGate(stage, stages, state) {
  const missing = lockedRequirements(stage, state);
  const firstRequired = stages.find((candidate) => candidate.id === missing[0]);
  const gate = document.createElement("section");
  gate.className = "threshold-access-gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.setAttribute("aria-labelledby", "threshold-access-gate-title");
  gate.innerHTML = `
    <div class="threshold-access-gate__panel">
      <p>Passage held</p>
      <h1 id="threshold-access-gate-title">${stage.label}</h1>
      <p>Complete ${missing.join(", ")} before entering this passage.</p>
      <a href="${firstRequired?.route || "/index.html"}">Return to ${firstRequired?.label || "Hub Entry"}</a>
    </div>`;
  document.body.dataset.accessLocked = "true";
  document.body.appendChild(gate);
}

function bindAcceptance(flow, state) {
  const acceptStage = flow.stages.find((stage) => stage.id === "accept");
  const button = document.querySelector("[data-threshold-accept]");
  if (!acceptStage || !button || !prerequisitesMet(acceptStage, state)) return;
  button.addEventListener("click", () => {
    const nextState = completeStage(acceptStage, readState(flow.storageKey));
    writeState(flow.storageKey, nextState);
    button.textContent = "Invitation Accepted";
    button.disabled = true;
    renderRail(flow, nextState);
    const engine = document.createElement("a");
    engine.className = "threshold-access-flow__continue";
    engine.href = "/deep-system/engine.html";
    engine.textContent = "Enter Engine";
    button.insertAdjacentElement("afterend", engine);
  });
}

async function initializeAccessFlow() {
  addStylesheet();
  const response = await fetch(FLOW_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Access flow unavailable (${response.status})`);
  const flow = await response.json();
  let state = readState(flow.storageKey);
  const currentStage = stageForLocation(flow.stages);

  if (currentStage && !prerequisitesMet(currentStage, state)) {
    renderRail(flow, state);
    renderGate(currentStage, flow.stages, state);
    return;
  }
  if (currentStage?.completion === "visit") {
    state = completeStage(currentStage, state);
    writeState(flow.storageKey, state);
  }

  renderRail(flow, state);
  bindAcceptance(flow, state);
  window.dispatchEvent(new CustomEvent("threshold:access-flow-ready", { detail: { flow, state } }));
}

initializeAccessFlow().catch((error) => {
  console.error("Threshold access flow failed to initialize", error);
});