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

const cometPositions = Object.freeze([
  ["12%", "76%", "-8s"],
  ["56%", "24%", "-21s"]
]);

function applySeasonTint(season) {
  document.documentElement.style.setProperty(
    "--season-color",
    seasonColors[season] || seasonColors.spring
  );
}

function addOortCloud() {
  const orbit = document.querySelector(".entry-orbit");
  const cosmicLayer = orbit?.querySelector(".hub-cosmic-rotation");
  if (!cosmicLayer || cosmicLayer.querySelector(".hub-oort")) {
    return;
  }
  oortPositions.forEach(([left, top], index) => {
    const particle = document.createElement("span");
    particle.className = "hub-oort";
    particle.style.left = `${left}px`;
    particle.style.top = `${top}px`;
    particle.style.setProperty("--hub-oort-delay", `${index * -1.125}s`);
    cosmicLayer.appendChild(particle);
  });
}

function addMicroComets() {
  const shell = document.querySelector(".entry-shell");
  if (!shell || shell.querySelector(".hub-comet")) {
    return;
  }
  cometPositions.forEach(([left, top, delay]) => {
    const comet = document.createElement("span");
    comet.className = "hub-comet";
    comet.style.left = left;
    comet.style.top = top;
    comet.style.setProperty("--hub-comet-delay", delay);
    shell.appendChild(comet);
  });
}

function wireRouteConstellations() {
  const panel = document.querySelector(".entry-panel");
  const orbit = document.querySelector(".entry-orbit");
  const routes = document.querySelectorAll(".entry-actions a");
  if (!panel || !orbit || routes.length === 0 || panel.querySelector(".hub-constellation")) {
    return;
  }
  const line = document.createElement("span");
  line.className = "hub-constellation";
  panel.appendChild(line);

  const updateLine = (route) => {
    const panelBounds = panel.getBoundingClientRect();
    const routeBounds = route.getBoundingClientRect();
    const orbitBounds = orbit.getBoundingClientRect();
    const startX = routeBounds.left - panelBounds.left;
    const startY = routeBounds.top + routeBounds.height / 2 - panelBounds.top;
    const endX = orbitBounds.left + orbitBounds.width / 2 - panelBounds.left;
    const endY = orbitBounds.top + orbitBounds.height / 2 - panelBounds.top;
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    line.style.width = `${Math.hypot(deltaX, deltaY)}px`;
    line.style.transform = `translate(${startX}px, ${startY}px) rotate(${Math.atan2(deltaY, deltaX)}rad)`;
    line.classList.add("is-visible");
  };
  routes.forEach((route) => {
    route.addEventListener("pointerenter", () => updateLine(route));
    route.addEventListener("focus", () => updateLine(route));
    route.addEventListener("pointerleave", () => line.classList.remove("is-visible"));
    route.addEventListener("blur", () => line.classList.remove("is-visible"));
  });
}

async function initializeEntryWarmth() {
  addOortCloud();
  addMicroComets();
  wireRouteConstellations();
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