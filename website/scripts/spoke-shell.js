import {
  createLevelState,
  createNodePulse,
  createThresholdPass,
  crownLevel,
  navigateSettlingZone,
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
  const cardNode = document.querySelector("[data-zone-card]");
  const cardCloseButton = document.querySelector("[data-card-close]");
  const cardVersionNode = document.querySelector("[data-card-version]");
  const cardTitleNode = document.querySelector("[data-card-title]");
  const cardImageNode = document.querySelector("[data-card-image]");
  const cardStoryNode = document.querySelector("[data-card-story]");
  const cardStatusNode = document.querySelector("[data-card-status]");
  const zoneGrid = document.querySelector("[data-zone-grid]");
  const history = [];
  let spoke = null;
  let activeFib = routeLineage ? routeLineage.fib : 8;
  let activeLevel = null;
  let activeCardChoice = null;
  let activeCardTrigger = null;

  function createRuntimeLevel(fib, versions, version, hasChoices) {
    const validVersions = versions.length ? versions : [version];
    const level = createLevelState({
      fib,
      versions: validVersions,
      version,
      fields: ["version", "choice", "shimmer", "stays"],
      required: hasChoices ? ["version", "choice"] : ["version"],
      pass: ["version", "choice"],
      state: { shimmer: false, stays: 0 }
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

  function cardStory(card) {
    const story = card && card.story;
    if (typeof story === "string") {
      return story;
    }
    return story && (story.body || story.excerpt || story.title) || "This path is ready.";
  }

  function reportInteractionError(error) {
    const message = error instanceof Error ? error.message : "Interaction unavailable";
    if (cardNode.open) {
      cardStatusNode.textContent = message;
    } else {
      statusNode.textContent = message;
    }
  }

  function closeCard(restoreFocus = true) {
    const trigger = restoreFocus ? activeCardTrigger : null;
    activeCardChoice = null;
    activeCardTrigger = null;
    if (cardNode.open) {
      cardNode.close();
    }
    if (trigger) {
      trigger.focus();
    }
  }

  async function openCard(choice, trigger) {
    activeCardChoice = choice;
    activeCardTrigger = trigger;
    activeLevel = updateLevelState(activeLevel, { choice: String(choice.id) });
    const card = choice.card || {};
    const image = typeof card.image === "string" ? card.image : card.image && card.image.webPath;
    const storyUrl = card.story && typeof card.story === "object" ? card.story.webPath : null;
    cardVersionNode.textContent = "Fib " + activeFib + " · " + activeLevel.state.version;
    cardTitleNode.textContent = card.title || choice.label;
    cardStoryNode.textContent = cardStory(card);
    cardStatusNode.textContent = "";
    zoneGrid.hidden = activeFib !== 8 && activeFib !== 5;
    if (image) {
      cardImageNode.src = image;
      cardImageNode.alt = typeof card.image === "object" && card.image.alt
        ? card.image.alt
        : card.title || choice.label;
      cardImageNode.hidden = false;
    } else {
      cardImageNode.removeAttribute("src");
      cardImageNode.alt = "";
      cardImageNode.hidden = true;
    }
    if (!cardNode.open) {
      cardNode.showModal();
    }
    if (storyUrl) {
      try {
        const response = await fetch(storyUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Story unavailable (" + response.status + ")");
        }
        const story = await response.text();
        if (activeCardChoice === choice) {
          cardStoryNode.textContent = story;
        }
      } catch (error) {
        if (activeCardChoice === choice) {
          cardStatusNode.textContent = error instanceof Error ? error.message : "Story unavailable";
        }
      }
    }
  }

  function rememberHubSeed(seed) {
    const storageKey = "threshold:hub-seeds";
    let seeds = [];
    try {
      seeds = JSON.parse(sessionStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(seeds)) {
        seeds = [];
      }
    } catch {
      seeds = [];
    }
    seeds.push(seed);
    sessionStorage.setItem(storageKey, JSON.stringify(seeds.slice(-24)));
  }

  function restorePrevious() {
    const previous = history.pop();
    if (!previous) {
      window.ThresholdNodes.loadManifest().then(function (manifest) {
        location.assign(manifest.hub || "index.html");
      }).catch(reportInteractionError);
      return;
    }
    renderNode(previous.node, previous.fib, previous.level);
  }

  async function moveInZone(direction) {
    const choice = activeCardChoice;
    let movement;
    let pulse;
    try {
      const crowned = crownLevel(activeLevel);
      movement = navigateSettlingZone(crowned, direction);
      pulse = createNodePulse(crowned, movement, direction);
    } catch (error) {
      window.dispatchEvent(new CustomEvent("threshold:pulse-rejected", {
        detail: {
          signal: String(direction || ""),
          reason: error instanceof Error ? error.message : "Pulse rejected"
        }
      }));
      throw error;
    }
    if (movement.action === "proceed") {
      const accepted = await activate(choice.activation, choice.id, true, pulse);
      if (!accepted) {
        return;
      }
      closeCard(false);
    } else {
      window.dispatchEvent(new CustomEvent("threshold:pulse-accepted", {
        detail: pulse
      }));
      activeLevel = movement.level;
    }
    if (movement.relic) {
      window.dispatchEvent(new CustomEvent("threshold:relic-left", {
        detail: movement.relic
      }));
    }
    if (movement.seed) {
      rememberHubSeed(movement.seed);
      window.dispatchEvent(new CustomEvent("threshold:hub-seed-returned", {
        detail: movement.seed
      }));
    }
    if (movement.action === "proceed") {
      return;
    }
    if (movement.action === "stay") {
      cardStatusNode.textContent = "Biome active · stay " + activeLevel.state.stays;
      window.dispatchEvent(new CustomEvent("threshold:biome-stayed", {
        detail: { fib: activeFib, state: activeLevel.state }
      }));
      return;
    }
    closeCard(false);
    if (movement.action === "return") {
      restorePrevious();
      return;
    }
    statusNode.textContent = "Fib " + activeFib + " · " + activeLevel.state.version + " selected.";
    window.dispatchEvent(new CustomEvent("threshold:level-rotated", {
      detail: { fib: activeFib, direction, version: activeLevel.state.version }
    }));
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
        openCard(choice, button).catch(reportInteractionError);
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

  async function activate(token, choiceId, moveInward, pulse = null) {
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
        pulse
      });
      if (pulse) {
        window.dispatchEvent(new CustomEvent("threshold:pulse-accepted", {
          detail: pulse
        }));
      }
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
      return true;
    } catch (error) {
      statusNode.textContent = error instanceof Error ? error.message : "Activation failed";
      if (pulse) {
        window.dispatchEvent(new CustomEvent("threshold:pulse-rejected", {
          detail: {
            signal: pulse.signal,
            reason: error instanceof Error ? error.message : "Pulse rejected"
          }
        }));
      }
      return false;
    }
  }

  backButton.addEventListener("click", function () {
    if (activeFib === 8 || activeFib === 5) {
      moveInZone("south").catch(reportInteractionError);
      return;
    }
    restorePrevious();
  });

  cardCloseButton.addEventListener("click", function () {
    closeCard();
  });
  cardNode.addEventListener("cancel", function (event) {
    event.preventDefault();
    closeCard();
  });
  cardNode.addEventListener("click", function (event) {
    if (event.target === cardNode) {
      closeCard();
    }
  });
  zoneGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-zone-direction]");
    if (!button) {
      return;
    }
    moveInZone(button.dataset.zoneDirection).catch(reportInteractionError);
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
