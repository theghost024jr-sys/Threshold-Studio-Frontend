(function () {
  "use strict";

  const root = document.querySelector("[data-threshold-spoke]");
  if (!root || !window.ThresholdNodes) {
    return;
  }

  const spokeId = root.dataset.thresholdSpoke || new URLSearchParams(location.search).get("id") || "";
  const shell = document.createElement("nav");
  shell.className = "spoke-access-tabs";
  shell.setAttribute("aria-label", "Spoke access");
  shell.innerHTML = [
    '<a class="spoke-access-tab" href="index.html">Hub</a>',
    '<button class="spoke-access-tab" type="button" data-seed-action>Plant Seed</button>',
    '<button class="spoke-access-tab" type="button" data-seed-gate="dialogues" aria-disabled="true">Dialogues</button>',
    '<button class="spoke-access-tab" type="button" data-seed-gate="contributions" aria-disabled="true">Contributions</button>',
    '<span class="spoke-access-state" data-seed-state role="status">Seed required</span>'
  ].join("");
  root.prepend(shell);

  const stateNode = shell.querySelector("[data-seed-state]");
  const plantButton = shell.querySelector("[data-seed-action]");
  const gatedButtons = Array.from(shell.querySelectorAll("[data-seed-gate]"));
  let seedPlanted = false;

  function renderState() {
    gatedButtons.forEach(function (button) {
      button.setAttribute("aria-disabled", seedPlanted ? "false" : "true");
      button.classList.toggle("is-locked", !seedPlanted);
    });
    plantButton.hidden = seedPlanted;
    stateNode.textContent = seedPlanted ? "Seed planted" : "Seed required";
  }

  async function loadProgression() {
    const response = await fetch("/api/progression", { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("Progression unavailable");
    }
    const progression = await response.json();
    seedPlanted = progression.seedPlanted === true;
    renderState();
  }

  plantButton.addEventListener("click", async function () {
    plantButton.disabled = true;
    stateNode.textContent = "Planting seed...";
    try {
      const response = await fetch("/api/seeds/plant", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spoke: spokeId })
      });
      if (!response.ok) {
        throw new Error("Seed was not accepted");
      }
      seedPlanted = true;
      renderState();
    } catch (error) {
      stateNode.textContent = error instanceof Error ? error.message : "Seed planting failed";
      plantButton.disabled = false;
    }
  });

  gatedButtons.forEach(function (button) {
    button.addEventListener("click", async function () {
      if (!seedPlanted) {
        stateNode.textContent = "Plant a seed to enter";
        return;
      }
      button.disabled = true;
      stateNode.textContent = "Opening " + button.textContent + "...";
      try {
        const node = await window.ThresholdNodes.activate({
          spokeId: spokeId,
          token: button.dataset.seedGate
        });
        if (node && node.entry) {
          location.assign(node.entry);
          return;
        }
        stateNode.textContent = button.textContent + " activated";
      } catch (error) {
        stateNode.textContent = error instanceof Error ? error.message : "Activation failed";
        button.disabled = false;
      }
    });
  });

  renderState();
  loadProgression().catch(function () {
    stateNode.textContent = "Seed gate offline";
  });
})();
