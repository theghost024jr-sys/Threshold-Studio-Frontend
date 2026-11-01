import {
  completeStage,
  createAccessState,
  contribute,
  lockedRequirements,
  prerequisitesMet,
  returnSeedToHub,
  validateAccessFlow,
  validateAuthoritativeState
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

function readState(storageKey, flow, legacyStorageKeys = []) {
  try {
    const stored = localStorage.getItem(storageKey)
      || legacyStorageKeys.map((key) => localStorage.getItem(key)).find(Boolean)
      || "{}";
    return validateAuthoritativeState(
      flow,
      createAccessState(JSON.parse(stored))
    );
  } catch (error) {
    console.error("Threshold access flow rejected contradictory saved state", error);
    localStorage.removeItem(storageKey);
    return createAccessState();
  }
}

function writeState(storageKey, state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Threshold access flow could not persist state.", error);
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
  const journeyState = state.seed
    ? "A Seed is carried toward the Hub"
    : state.returnedSeeds.length > 0
      ? "A Seed has returned · awaiting validation"
      : state.shimmer
        ? "Shimmer held"
        : "Find Shimmer";
  heading.innerHTML = `<strong>${project ? `${project.label} Chamber` : "Threshold Graft"}</strong><span>${journeyState}</span>`;

  const steps = document.createElement("ol");
  steps.className = "threshold-access-flow__steps";
  const completed = new Set(state.completed);
  flow.stages.forEach((stage) => {
    const item = document.createElement("li");
    const unlocked = prerequisitesMet(stage, state);
    const control = document.createElement(unlocked ? "a" : "span");
    control.textContent = stage.label;
    control.dataset.state = completed.has(stage.id) ? "complete" : unlocked ? "available" : "locked";
    if (stage.awardsShimmer === true && completed.has(stage.id)) {
      control.dataset.thresholdState = "shimmer";
    } else if (stage.kind === "contribution" && unlocked && !state.seed && !state.returnedSeeds.includes(stage.id)) {
      control.dataset.thresholdState = "seed-available";
    } else if (state.seed?.chamber === stage.id) {
      control.dataset.thresholdState = "seed-carried";
    } else if (state.returnedSeeds.includes(stage.id)) {
      control.dataset.thresholdState = "seed-returned";
    }
    if (unlocked) control.href = stage.route;
    if (!unlocked) control.title = `Requires ${lockedRequirements(stage, state).join(", ")}`;
    item.appendChild(control);
    steps.appendChild(item);
  });

  rail.append(heading, steps);
  document.body.appendChild(rail);
}

function bindAcceptance(flow, state) {
  const stage = stageForLocation(flow.stages);
  const button = document.querySelector("[data-threshold-contribution]");
  if (!stage || stage.kind !== "contribution" || !button || !prerequisitesMet(stage, state)) return;
  button.addEventListener("click", () => {
    const nextState = contribute(
      stage,
      readState(flow.storageKey, flow, flow.legacyStorageKeys)
    );
    writeState(flow.storageKey, nextState);
    button.textContent = "The Seed is carried";
    button.dataset.seedState = "carried";
    button.disabled = true;
    renderRail(flow, nextState);
    const hub = document.createElement("a");
    hub.className = "threshold-access-flow__continue";
    hub.href = "/index.html";
    hub.textContent = "Carry this return toward the Hub";
    button.insertAdjacentElement("afterend", hub);
  });
}

async function initializeAccessFlow() {
  addStylesheet();
  const response = await fetch(FLOW_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Access flow unavailable (${response.status})`);
  const flow = validateAccessFlow(await response.json());
  let state = readState(flow.storageKey, flow, flow.legacyStorageKeys);
  const currentStage = stageForLocation(flow.stages);

  if (currentStage && !prerequisitesMet(currentStage, state)) {
    renderRail(flow, state);
    window.dispatchEvent(new CustomEvent("threshold:access-flow-ready", { detail: { flow, state } }));
    return;
  }
  if (currentStage?.completion === "visit") {
    state = completeStage(currentStage, state);
  }
  if (currentStage?.id === "hub") {
    state = returnSeedToHub(currentStage, state);
  }
  writeState(flow.storageKey, state);

  renderRail(flow, state);
  bindAcceptance(flow, state);
  window.dispatchEvent(new CustomEvent("threshold:access-flow-ready", { detail: { flow, state } }));
}

initializeAccessFlow().catch((error) => {
  console.error("Threshold access flow failed to initialize", error);
});