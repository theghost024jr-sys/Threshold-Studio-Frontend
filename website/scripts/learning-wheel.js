import { getCalendarSeason, getSeasonProfile, seasonProfiles } from "./learning-wheel-state.js";

const page = document.body;
const choices = Array.from(document.querySelectorAll("[data-season-choice]"));
const portals = Array.from(document.querySelectorAll("[data-season-portal]"));
const status = document.getElementById("wheelStatus");
const vector = document.getElementById("wheelVector");
const gate = document.getElementById("wheelGate");
const memory = document.getElementById("wheelMemory");
const seasonalAlcove = document.getElementById("seasonalAlcove");
const seasonalAlcovePanel = document.getElementById("seasonalAlcovePanel");
const stormCabinetPanel = document.getElementById("stormCabinetPanel");
const storageKey = "threshold.learningWheel.state.v1";
const glyphReturnStorageKey = "threshold.learningWheel.glyphReturns.v1";
const visitedSeasons = new Set();

function updateSeasonalAlcove() {
  const count = visitedSeasons.size;
  const requestedNode = new URLSearchParams(window.location.search).get("node");
  const isAlcoveRequested = requestedNode === "seasonal-alcove";
  const isStormCabinetRequested = requestedNode === "storm-cabinet";
  let hasStormCabinetAccess = false;
  try {
    const glyphReturns = JSON.parse(localStorage.getItem(glyphReturnStorageKey) || "null");
    hasStormCabinetAccess = glyphReturns?.rareEvent === true
      && new Set(glyphReturns.glyphs || []).size >= 2;
  } catch (error) {
    console.warn("Storm Cabinet access could not be restored.", error);
  }
  if (memory) {
    memory.textContent = count === 4
      ? "All four seasonal movements recognized."
      : `${count} / 4 seasonal movements recognized.`;
  }
  if (seasonalAlcove) {
    seasonalAlcove.hidden = count !== 4;
  }
  if (seasonalAlcovePanel) {
    seasonalAlcovePanel.hidden = count !== 4 || !isAlcoveRequested;
  }
  if (stormCabinetPanel) {
    stormCabinetPanel.hidden = !isStormCabinetRequested || !hasStormCabinetAccess;
  }
}

function activateSeason(season, persist = true) {
  const profile = getSeasonProfile(season);
  const portal = portals.find((item) => item.dataset.seasonPortal === season);
  page.dataset.season = season;
  page.style.setProperty("--wheel-turn", `${profile.turn}deg`);
  document.getElementById("wheelSeason").textContent = profile.label;
  document.getElementById("wheelDirection").textContent = profile.direction;
  document.getElementById("wheelPulse").textContent = profile.pulseDepth;
  document.getElementById("wheelWeather").textContent = profile.weather;
  status.textContent = profile.rationale;
  if (vector) vector.textContent = profile.rationale;
  if (gate && portal) {
    gate.href = portal.href;
    gate.textContent = `Enter ${portal.textContent.trim()}`;
  }
  portals.forEach((item) => item.setAttribute("aria-current", String(item === portal)));
  choices.forEach((choice) => choice.setAttribute("aria-pressed", String(choice.dataset.seasonChoice === season)));
  if (persist) {
    visitedSeasons.add(season);
    updateSeasonalAlcove();
    localStorage.setItem("threshold.learningWheel.state.v1", JSON.stringify({
      state: { season, phase: "reflect", coherence: "soft" },
      pulseProfile: profile,
      visitedSeasons: [...visitedSeasons]
    }));
  }
  window.dispatchEvent(new CustomEvent("threshold:learning-wheel-update", { detail: profile }));
}

choices.forEach((choice) => choice.addEventListener("click", () => activateSeason(choice.dataset.seasonChoice)));
portals.forEach((portal) => portal.addEventListener("click", () => {
  activateSeason(portal.dataset.seasonPortal);
}));

let initialSeason = getCalendarSeason();
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
  if (Object.hasOwn(seasonProfiles, stored?.state?.season)) {
    initialSeason = stored.state.season;
  }
  (stored?.visitedSeasons || []).forEach((season) => {
    if (Object.hasOwn(seasonProfiles, season)) visitedSeasons.add(season);
  });
} catch (error) {
  console.warn("Learning Wheel state could not be restored.", error);
}
updateSeasonalAlcove();
activateSeason(initialSeason, false);