(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const spokeId = params.get("id") || "";
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

  function renderNode(node, pushHistory) {
    if (pushHistory && window.ThresholdNodes.getActiveNode()) {
      history.push(window.ThresholdNodes.getActiveNode());
    }
    nodeShell.hidden = false;
    enterButton.hidden = true;
    fibNode.textContent = "Fib " + String(node.fib || "");
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
        activate(choice.activation, choice.id);
      });
      choicesNode.appendChild(button);
    });
    backButton.hidden = history.length === 0;
    statusNode.textContent = (node.choices || []).length
      ? "Only the immediate choices below have been revealed."
      : "This is the active depth node.";
  }

  async function activate(token, choiceId) {
    statusNode.textContent = "Activating next node...";
    try {
      const previous = window.ThresholdNodes.getActiveNode();
      const node = await window.ThresholdNodes.activate({ spokeId, token, choiceId });
      if (previous) {
        history.push(previous);
      }
      renderNode(node, false);
    } catch (error) {
      statusNode.textContent = error instanceof Error ? error.message : "Activation failed";
    }
  }

  backButton.addEventListener("click", function () {
    const previous = history.pop();
    if (!previous) {
      return;
    }
    renderNode(previous, false);
  });

  enterButton.addEventListener("click", function () {
    activate(spoke.bootstrapActivation);
  });

  window.ThresholdNodes.resolveSpoke(spokeId).then(function (resolved) {
    spoke = resolved;
    body.dataset.thresholdSpoke = spoke.id;
    document.title = spoke.label + " - Threshold";
    titleNode.textContent = spoke.label;
    statusNode.textContent = "Fib 2 is ready. Deeper Fibs remain dormant.";
  }).catch(function (error) {
    titleNode.textContent = "Route unavailable";
    statusNode.textContent = error instanceof Error ? error.message : "Unknown route";
    enterButton.hidden = true;
  });
})();
