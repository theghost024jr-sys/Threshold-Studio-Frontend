import { getCalendarSeason, getSeasonProfile } from "./learning-wheel-state.js";

const page = document.body;
const choices = Array.from(document.querySelectorAll("[data-season-choice]"));
const portals = Array.from(document.querySelectorAll("[data-season-portal]"));
const status = document.getElementById("wheelStatus");
const dialog = document.getElementById("seasonDialog");
const portalContent = {
  spring: ["Sprout Gallery", "First forms appear through fog. Nothing is forced into clarity before it is ready."],
  summer: ["Shimmer Chamber", "Resonance widens through tide, color, and outward motion without abandoning form."],
  autumn: ["Collapse Lore", "Pressure becomes weather. Fracture is read as information rather than failure."],
  winter: ["Soil Archive", "The cycle settles. What was carried becomes structure, nourishment, and anchor."]
};

function activateSeason(season, persist = true) {
  const profile = getSeasonProfile(season);
  page.dataset.season = season;
  page.style.setProperty("--wheel-turn", `${profile.turn}deg`);
  document.getElementById("wheelSeason").textContent = profile.label;
  document.getElementById("wheelDirection").textContent = profile.direction;
  document.getElementById("wheelPulse").textContent = profile.pulseDepth;
  document.getElementById("wheelWeather").textContent = profile.weather;
  status.textContent = profile.rationale;
  choices.forEach((choice) => choice.setAttribute("aria-pressed", String(choice.dataset.seasonChoice === season)));
  if (persist) {
    localStorage.setItem("threshold.learningWheel.state.v1", JSON.stringify({ state: { season, phase: "reflect", coherence: "soft" }, pulseProfile: profile }));
  }
  window.dispatchEvent(new CustomEvent("threshold:learning-wheel-update", { detail: profile }));
}

choices.forEach((choice) => choice.addEventListener("click", () => activateSeason(choice.dataset.seasonChoice)));
portals.forEach((portal) => portal.addEventListener("click", () => {
  const season = portal.dataset.seasonPortal;
  const [title, body] = portalContent[season];
  activateSeason(season);
  document.getElementById("seasonDialogKicker").textContent = `${getSeasonProfile(season).label} portal`;
  document.getElementById("seasonDialogTitle").textContent = title;
  document.getElementById("seasonDialogBody").textContent = body;
  dialog.showModal();
}));
document.querySelector(".season-dialog-close").addEventListener("click", () => dialog.close());

let initialSeason = getCalendarSeason();
try {
  const stored = JSON.parse(localStorage.getItem("threshold.learningWheel.state.v1") || "null");
  initialSeason = stored?.state?.season || initialSeason;
} catch {}
activateSeason(initialSeason, false);