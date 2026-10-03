const seasonColors = Object.freeze({
  spring: "rgba(198, 232, 178, 0.25)",
  summer: "rgba(255, 200, 150, 0.25)",
  autumn: "rgba(236, 167, 103, 0.25)",
  winter: "rgba(176, 210, 255, 0.25)"
});

const lightPositions = Object.freeze([
  [8, 22], [78, 10], [106, 44], [32, 88],
  [128, 102], [74, 132], [148, 28], [4, 120]
]);

function applySeasonTint(season) {
  document.documentElement.style.setProperty(
    "--season-color",
    seasonColors[season] || seasonColors.spring
  );
}

function addAmbientLights() {
  const orbit = document.querySelector(".entry-orbit");
  if (!orbit || orbit.querySelector(".hub-light")) {
    return;
  }
  lightPositions.forEach(([left, top], index) => {
    const light = document.createElement("span");
    light.className = "hub-light";
    light.style.left = `${left}px`;
    light.style.top = `${top}px`;
    light.style.setProperty("--hub-light-delay", `${index * -1.5}s`);
    orbit.appendChild(light);
  });
}

async function initializeEntryWarmth() {
  addAmbientLights();
  const engine = window.threshold;
  if (!engine) {
    return;
  }
  await engine.boot();
  applySeasonTint(engine.getSeason());
  window.addEventListener("threshold:season-changed", (event) => {
    applySeasonTint(event.detail?.season);
  });
}

initializeEntryWarmth().catch(() => {});