import {
  createLevelState,
  createThresholdPass,
  crownLevel,
  nextFibonacciFib,
  readFibonacciLineage,
  updateLevelState
} from "./fibonacci-routing.js";

(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const spokeId = params.get("id") || "";
  const routeLineage = readFibonacciLineage(location.search);
  const body = document.body;
  const titleNode = document.querySelector("[data-spoke-title]");
  const statusNode = document.querySelector("[data-spoke-status]");
  const enterButton = document.querySelector("[data-spoke-enter]");
  const nodeShell = document.querySelector("[data-node]");
  const fibNode = document.querySelector("[data-node-fib]");
  const kindNode = document.querySelector("[data-node-kind]");
  const nodeTitle = document.querySelector("[data-node-title]");
  const contentNode = document.querySelector("[data-node-content]");
  const choicesNode = document.querySelector("[data-node-choices]");
  const backButton = document.querySelector("[data-node-back]");
  const history = [];
  let spoke = null;
  let activeFib = routeLineage ? routeLineage.fib : 8;
  let activeLevel = null;

  function createRuntimeLevel(fib, versions, version, hasChoices) {
    const validVersions = versions.length ? versions : [version];
    const level = createLevelState({
      fib,
      versions: validVersions,
      version,
      fields: ["version", "choice", "shimmer"],
      required: hasChoices ? ["version", "choice"] : ["version"],
      pass: ["version", "choice"],
      state: { shimmer: false }
    });
    return hasChoices ? level : crownLevel(level);
  }

  async function loadInitialVersions() {
    if (!routeLineage) {
      return [spokeId];
    }
    try {
      const response = await fetch("config/fibonacci-routes.json", { cache: "no-store" });
      if (!response.ok) {
        return [routeLineage.version];
      }
      const config = await response.json();
      const configured = config.spokes && config.spokes[spokeId];
      const versions = (configured && configured.routes || [])
        .filter((route) => route.targetFib === routeLineage.fib)
        .map((route) => route.version);
      return versions.length ? versions : [routeLineage.version];
    } catch {
      return [routeLineage.version];
    }
  }

  function summarize(content) {
    if (!content) {
      return "Choose the next available node.";
    }
    if (typeof content === "string") {
      return content;
    }
    const note = content.note || content;
    return note.excerpt || note.body || note.title || "Choose the next available node.";
  }

  function summarizeComponents(components) {
    return (components || []).map(function (component) {
      const label = String(component.type || "component").replace(/-/g, " ");
      return label.toUpperCase() + "\n" + summarize(component.content);
    }).join("\n\n");
  }

  function renderNode(node, displayFib, displayLevel) {
    activeFib = displayFib;
    activeLevel = displayLevel;
    nodeShell.hidden = false;
    enterButton.hidden = true;
    fibNode.textContent = "Fib " + String(activeFib);
    kindNode.textContent = String(node.kind || "node").replace(/-/g, " ");
    nodeTitle.textContent = node.title || String(node.id || spoke.label).replace(/^[^:]+:/, "").replace(/-/g, " ");
    contentNode.textContent = node.components && node.components.length
      ? summarizeComponents(node.components)
      : summarize(node.content);
    choicesNode.replaceChildren();
    (node.choices || []).forEach(function (choice) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "spoke-node-choice";
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        activate(choice.activation, choice.id, true);
      });
      choicesNode.appendChild(button);
    });
    backButton.hidden = history.length === 0;
    statusNode.textContent = (node.choices || []).length
      ? "Only the immediate choices below have been revealed."
      : activeLevel && activeLevel.crowned
        ? "Fib " + activeFib + " crowned."
        : "This is the active depth node.";
  }

  async function activate(token, choiceId, moveInward) {
    statusNode.textContent = "Activating next node...";
    try {
      const previous = window.ThresholdNodes.getActiveNode();
      const displayFib = previous && moveInward ? nextFibonacciFib(activeFib) : activeFib;
      let thresholdPass = null;
      let nextLevel = activeLevel;
      if (previous && moveInward) {
        const completed = updateLevelState(activeLevel, { choice: choiceId });
        const crowned = crownLevel(completed);
        thresholdPass = createThresholdPass(crowned);
        const versions = (previous.choices || []).map((choice) => String(choice.id));
        nextLevel = createRuntimeLevel(
          displayFib,
          versions,
          String(choiceId),
          false
        );
        window.dispatchEvent(new CustomEvent("threshold:level-crowned", {
          detail: { fib: crowned.fib, state: crowned.state }
        }));
      }
      const node = await window.ThresholdNodes.activate({
        spokeId,
        token,
        choiceId,
        pass: thresholdPass
      });
      if (thresholdPass) {
        nextLevel = createRuntimeLevel(
          displayFib,
          (previous.choices || []).map((choice) => String(choice.id)),
          String(choiceId),
          (node.choices || []).length > 0
        );
      }
      if (previous) {
        history.push({ node: previous, fib: activeFib, level: activeLevel });
      }
      renderNode(node, displayFib, nextLevel);
      if (thresholdPass) {
        window.dispatchEvent(new CustomEvent("threshold:level-passed", {
          detail: thresholdPass
        }));
      }
    } catch (error) {
      statusNode.textContent = error instanceof Error ? error.message : "Activation failed";
    }
  }

  backButton.addEventListener("click", function () {
    const previous = history.pop();
    if (!previous) {
      return;
    }
    renderNode(previous.node, previous.fib, previous.level);
  });

  enterButton.addEventListener("click", function () {
    const routeChoice = routeLineage
      ? routeLineage.path + ":" + routeLineage.version
      : null;
    activate(spoke.bootstrapActivation, routeChoice);
  });

  Promise.all([
    window.ThresholdNodes.resolveSpoke(spokeId),
    loadInitialVersions()
  ]).then(function ([resolved, versions]) {
    spoke = resolved;
    const version = routeLineage ? routeLineage.version : spoke.id;
    activeLevel = createRuntimeLevel(activeFib, versions, version, true);
    body.dataset.thresholdSpoke = spoke.id;
    document.title = spoke.label + " - Threshold";
    titleNode.textContent = spoke.label;
    fibNode.textContent = "Fib " + String(routeLineage ? routeLineage.fib : 8);
    statusNode.textContent = routeLineage
      ? routeLineage.path.replace(/-/g, " ") + " · " + routeLineage.version + " is ready."
      : "Fib 8 is ready. Deeper Fibs remain dormant.";
  }).catch(function (error) {
    titleNode.textContent = "Route unavailable";
    statusNode.textContent = error instanceof Error ? error.message : "Unknown route";
    enterButton.hidden = true;
  });
})();
