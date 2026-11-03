import { createEngineInterface } from "./engine-interface.js";
import { createMainHubEngineAdapter } from "./main-hub-engine-adapter.js";
import { createMainHubRuntime } from "./main-hub-runtime.js";

const root = document.body;
const crossing = document.querySelector("[data-main-hub-first-crossing]");

if (crossing) {
  const engineInterface = createEngineInterface({
    endpoint: root.dataset.engineEndpoint,
    root,
  });
  const engine = createMainHubEngineAdapter({ engineInterface });
  const runtime = createMainHubRuntime({
    engine,
    destination: crossing.getAttribute("href"),
    navigate(destination) {
      window.location.assign(destination);
    },
    onStateChange({ state }) {
      root.dataset.mainHubCrossingState = state;
    },
  });

  void runtime.initialize();

  crossing.addEventListener("click", (event) => {
    if (
      event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
    ) {
      return;
    }

    event.preventDefault();
    void runtime.requestFirstCrossing();
  });

  window.addEventListener("pagehide", () => runtime.destroy(), { once: true });
}
