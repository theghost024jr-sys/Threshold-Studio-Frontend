import {
  GARDEN_EVIDENCE_STORAGE_KEY,
  gardenRepresentation,
  readGardenObservation
} from "./garden-evidence-state.js";

const status = document.querySelector("[data-garden-evidence-status]");
const root = document.body;

function renderGardenEvidence() {
  try {
    const evidence = readGardenObservation(window.localStorage);
    const representation = gardenRepresentation(evidence);
    root.dataset.gardenEvidence = representation;

    if (representation === "remembered") {
      status.textContent = "A remembered possibility holds at the edge of the Garden.";
    } else if (representation === "seen") {
      status.textContent = "The Garden has been seen through the Herb Room window.";
    } else {
      status.textContent = "The Garden is known here as an idea.";
    }
  } catch (error) {
    console.error("Unable to read Garden observation evidence.", error);
    root.dataset.gardenEvidence = "idea";
    status.textContent = "The Garden is known here as an idea.";
  }
}

window.addEventListener("storage", (event) => {
  if (event.key === GARDEN_EVIDENCE_STORAGE_KEY) {
    renderGardenEvidence();
  }
});

renderGardenEvidence();
