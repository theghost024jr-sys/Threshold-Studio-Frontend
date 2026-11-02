import { createEngineInterface } from "./engine-interface.js";

const root = document.body;
const crossing = document.querySelector(".entry-crossing");
const endpoint = root.dataset.engineEndpoint;
const canonicalNodeIds = new Set(["housegarden"]);

if (!endpoint || !crossing) {
  throw new Error("Main Hub Engine integration requires an endpoint and first crossing.");
}

const engine = createEngineInterface({ endpoint, root });

async function synchronizeHub() {
  try {
    await engine.tick();
  } catch (error) {
    root.dataset.engineConnected = "false";
    console.error("Main Hub could not synchronize with the Threshold Engine.", error);
  }
}

crossing.addEventListener("click", async (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  try {
    const result = await engine.activateNode("housegarden", canonicalNodeIds);
    if (result.type === "rejected") {
      throw new Error(result.message);
    }
  } catch (error) {
    root.dataset.engineConnected = "false";
    console.error("Main Hub could not activate the House and Garden crossing.", error);
  }
  window.location.assign(crossing.href);
});

void synchronizeHub();
