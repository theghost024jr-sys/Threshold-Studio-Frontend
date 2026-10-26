import { getCalendarSeason, getSeasonProfile, seasonProfiles } from "./learning-wheel-state.js";

const page = document.body;
const choices = Array.from(document.querySelectorAll("[data-season-choice]"));
const portals = Array.from(document.querySelectorAll("[data-season-portal]"));
const status = document.getElementById("wheelStatus");

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
  activateSeason(portal.dataset.seasonPortal);
}));

let initialSeason = getCalendarSeason();
try {
  const stored = JSON.parse(localStorage.getItem("threshold.learningWheel.state.v1") || "null");
  if (Object.hasOwn(seasonProfiles, stored?.state?.season)) {
    initialSeason = stored.state.season;
  }
} catch (error) {
  console.warn("Learning Wheel state could not be restored.", error);
}
activateSeason(initialSeason, false);