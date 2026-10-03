const NODE_IDS = ["housegarden", "herb_room", "greenhouse", "lagoon", "camp"];
const SEASONS = ["spring", "summer", "autumn", "winter"];

function renderState(root, engine) {
  const active = document.body.dataset.thresholdBiome || "housegarden";
  const nodes = NODE_IDS.map((id) => engine.getNode(id)).filter(Boolean);
  root.innerHTML = [
    '<div><p class="housegarden-runtime__kicker">Runtime cluster</p><h2>Connected biomes</h2></div>',
    `<label>Season<select data-housegarden-season>${SEASONS.map((season) => `<option value="${season}"${engine.getSeason() === season ? " selected" : ""}>${season}</option>`).join("")}</select></label>`,
    '<output data-housegarden-runtime-status></output>',
    '<ul class="housegarden-runtime__list">',
    ...nodes.map((node) => {
      const weather = typeof node.weather === "object" ? node.weather : {};
      const physics = node.physics || {};
      const current = node.id === active ? ' data-active="true"' : "";
      return `<li${current}><strong>${node.id.replace(/_/g, " ")}</strong><span>H ${Number(weather.humidity || 0).toFixed(1)} · P ${Number(physics.pressure || 0)} · R ${Number(physics.resonance || 0).toFixed(1)}</span></li>`;
    }),
    '</ul>',
    '<button type="button" data-reset-housegarden>Reset cluster state</button>'
  ].join("");
}

async function initialize() {
  const root = document.querySelector("[data-housegarden-runtime]");
  const engine = window.threshold;
  if (!root || !engine) {
    return;
  }
  await engine.boot();
  const refresh = () => renderState(root, engine);
  refresh();
  ["threshold:node-updated", "threshold:node-navigated", "threshold:node-states-reset", "threshold:season-changed"].forEach((eventName) => {
    window.addEventListener(eventName, refresh);
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-housegarden-season]")) {
      engine.setSeason(event.target.value);
    }
  });
  root.addEventListener("click", (event) => {
    if (!event.target.matches("[data-reset-housegarden]")) {
      return;
    }
    engine.resetPersistedNodeStates();
    root.querySelector("[data-housegarden-runtime-status]").textContent = "Defaults restored";
  });
}

initialize().catch(() => {});