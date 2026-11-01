const STORAGE_KEY = "threshold.canonicalPath.v1";
const TOPOLOGY_URL = "/config/world-topology.json";

function currentPath() {
  return location.pathname === "/" ? "/index.html" : location.pathname;
}

function readProgress() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
    return {
      visited: Array.isArray(stored.visited)
        ? stored.visited.filter((id) => typeof id === "string")
        : [],
      released: stored.released === true,
      heardBasin: stored.heardBasin === true,
      guidanceDismissed: stored.guidanceDismissed === true
    };
  } catch (error) {
    console.warn("Canonical path progress could not be restored.", error);
    return { visited: [], released: false };
  }
}

function writeProgress(progress) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Canonical path progress could not be saved.", error);
  }
}

function routeAnchors(route) {
  return [...document.querySelectorAll("a[href]")].filter(
    (anchor) => new URL(anchor.getAttribute("href"), location.href).pathname === route
  );
}

function loadStyles() {
  if (document.querySelector('link[href="/styles/canonical-path.css"]')) {
    return;
  }
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/styles/canonical-path.css";
  document.head.appendChild(stylesheet);
}

function emphasize(route, cue) {
  routeAnchors(route).forEach((anchor) => {
    anchor.classList.add("canonical-path__next");
    anchor.dataset.canonicalCue = cue;
  });
}

function bindAlternateRouteChoice(nextRoute) {
  const routes = document.querySelectorAll(".entry-actions a[href]");
  routes.forEach((route) => {
    const destination = new URL(route.getAttribute("href"), location.href).pathname;
    if (destination === nextRoute || destination === currentPath()) {
      return;
    }
    route.addEventListener("click", () => {
      const progress = readProgress();
      writeProgress({ ...progress, guidanceDismissed: true });
    });
  });
}

function markSoundDiscovery() {
  const toggle = document.querySelector(".sound-toggle");
  if (!toggle) {
    return;
  }
  toggle.dataset.canonicalCue = "Sound begins here.";
  toggle.addEventListener("click", () => {
    const progress = readProgress();
    if (!progress.released) {
      writeProgress({ ...progress, heardBasin: true });
    }
  });
}

async function loadTopology() {
  const response = await fetch(TOPOLOGY_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Canonical topology unavailable (${response.status}).`);
  }
  const topology = await response.json();
  if (
    !Array.isArray(topology.places)
    || !Array.isArray(topology.canonicalEntryPath)
    || topology.canonicalEntryPath.length < 2
  ) {
    throw new Error("Canonical topology has no declared entry path.");
  }
  return topology;
}

async function initializeCanonicalPath() {
  let topology;
  try {
    topology = await loadTopology();
  } catch (error) {
    console.error("Canonical path could not load its topology.", error);
    return;
  }

  const places = new Map(topology.places.map((place) => [place.id, place]));
  const place = topology.places.find((candidate) => candidate.route === currentPath());
  const currentIndex = topology.canonicalEntryPath.indexOf(place?.id);
  if (currentIndex === -1) {
    return;
  }

  const previousId = topology.canonicalEntryPath[currentIndex - 1];
  const nextId = topology.canonicalEntryPath[currentIndex + 1];
  const nextPlace = nextId ? places.get(nextId) : null;
  if (nextPlace && !place.connectsTo.includes(nextPlace.id)) {
    console.error("Canonical path seam is not declared in world topology.", {
      from: place.id,
      to: nextPlace.id
    });
    return;
  }

  loadStyles();
  const progress = readProgress();
  if (!nextPlace) {
    writeProgress({
      ...progress,
      visited: [...new Set([...progress.visited, place.id])],
      released: true
    });
    return;
  }

  const visited = [...new Set([...progress.visited, place.id])];
  const nextProgress = { ...progress, visited };
  writeProgress(nextProgress);
  if (place.id === topology.entry) {
    bindAlternateRouteChoice(nextPlace.route);
  }
  if (
    nextProgress.released
    || nextProgress.guidanceDismissed
    || (previousId && !visited.includes(previousId))
  ) {
    return;
  }

  if (nextPlace) {
    const cue = place.id === "entry-hub"
      ? "A first path leads inward."
      : place.id === "basin"
        ? "The world opens beyond the water."
        : "The next seam is nearby.";
    emphasize(nextPlace.route, cue);
  }
  if (place.id === "basin") {
    markSoundDiscovery();
  }
}

initializeCanonicalPath();
