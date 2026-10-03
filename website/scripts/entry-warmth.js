const seasonColors = Object.freeze({
  spring: "rgba(198, 232, 178, 0.25)",
  summer: "rgba(255, 200, 150, 0.25)",
  autumn: "rgba(236, 167, 103, 0.25)",
  winter: "rgba(176, 210, 255, 0.25)"
});

function applySeasonTint(season) {
  document.documentElement.style.setProperty(
    "--season-color",
    seasonColors[season] || seasonColors.spring
  );
}

async function initializeEntryWarmth() {
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