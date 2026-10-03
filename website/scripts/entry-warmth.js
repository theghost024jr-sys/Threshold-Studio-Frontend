const seasonColors = Object.freeze({
  spring: "rgba(198, 232, 178, 0.25)",
  summer: "rgba(255, 200, 150, 0.25)",
  autumn: "rgba(236, 167, 103, 0.25)",
  winter: "rgba(176, 210, 255, 0.25)"
});

const oortPositions = Object.freeze([
  [-176, -120], [-96, -180], [8, -148], [94, -188],
  [172, -98], [210, 2], [162, 112], [82, 186],
  [-18, 210], [-112, 158], [-194, 74], [-212, -18],
  [-142, -42], [38, -58], [122, 42], [-44, 92]
]);

function applySeasonTint(season) {
  document.documentElement.style.setProperty(
    "--season-color",
    seasonColors[season] || seasonColors.spring
  );
}

function addOortCloud() {
  const orbit = document.querySelector(".entry-orbit");
  if (!orbit || orbit.querySelector(".hub-oort")) {
    return;
  }
  oortPositions.forEach(([left, top], index) => {
    const particle = document.createElement("span");
    particle.className = "hub-oort";
    particle.style.left = `${left}px`;
    particle.style.top = `${top}px`;
    particle.style.setProperty("--hub-oort-delay", `${index * -1.125}s`);
    orbit.appendChild(particle);
  });
}

async function initializeEntryWarmth() {
  addOortCloud();
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