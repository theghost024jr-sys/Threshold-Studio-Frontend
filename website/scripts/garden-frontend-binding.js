const GARDEN_RUNTIME_STATE_URL = "/runtime/garden/garden-runtime-state.json";
const GARDEN_TICK_EVENT = "threshold:heartbeat-field";
export const GARDEN_TICK_INTERVAL_MS = 12000;
export const GARDEN_FEEDS = Object.freeze([
  "growth",
  "adjacency",
  "drift-capture",
  "pressure-spread",
  "biome-shift",
  "environment-signals"
]);

const COMPONENT_METHODS = [
  "setGrowth",
  "setAdjacency",
  "setDriftCapture",
  "setPressureSpread",
  "setBiomeShift",
  "setEnvironmentSignals",
  "setVisual",
  "setNavigation",
  "updateGardenAnimation"
];

export function gardenFeedSnapshot(gardenState) {
  return {
    growth: gardenState.growth,
    adjacency: gardenState.adjacency,
    "drift-capture": gardenState.driftCapture,
    "pressure-spread": gardenState.pressureSpread,
    "biome-shift": gardenState.biomeShift,
    "environment-signals": gardenState.environmentSignals
  };
}

function selectFeeds(gardenState, feeds) {
  const snapshot = gardenFeedSnapshot(gardenState);
  const unknown = feeds.filter((feed) => !GARDEN_FEEDS.includes(feed));
  if (unknown.length > 0) throw new TypeError(`Unknown Garden feeds: ${unknown.join(", ")}`);
  return Object.fromEntries(feeds.map((feed) => [feed, snapshot[feed]]));
}

export async function loadGardenState({
  fetchImpl = globalThis.fetch,
  url = GARDEN_RUNTIME_STATE_URL
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("Garden binding requires a fetch implementation");
  }

  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Garden runtime state unavailable (${response.status})`);
  }
  return response.json();
}

function assertComponent(component) {
  const missing = COMPONENT_METHODS.filter((method) => typeof component?.[method] !== "function");
  if (missing.length > 0) {
    throw new TypeError(`Garden component is missing: ${missing.join(", ")}`);
  }
}

export function bindGardenComponent(gardenState, component, { feeds = GARDEN_FEEDS } = {}) {
  assertComponent(component);
  component.setGrowth(gardenState.growth);
  component.setAdjacency(gardenState.adjacency);
  component.setDriftCapture(gardenState.driftCapture);
  component.setPressureSpread(gardenState.pressureSpread);
  component.setBiomeShift(gardenState.biomeShift);
  component.setEnvironmentSignals(gardenState.environmentSignals);
  component.setVisual(gardenState.visual);
  component.setNavigation(gardenState.navigation);
  const snapshot = selectFeeds(gardenState, feeds);
  component.updateGardenAnimation(snapshot);
  return snapshot;
}

export function startGardenBinding(component, {
  eventTarget = globalThis.window,
  loadState = loadGardenState,
  onError = (error) => console.error("Garden binding error:", error),
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
  intervalMs = GARDEN_TICK_INTERVAL_MS,
  feeds = GARDEN_FEEDS,
  onUpdate = () => {}
} = {}) {
  assertComponent(component);
  if (typeof eventTarget?.addEventListener !== "function") {
    throw new TypeError("Garden binding requires an event target");
  }
  if (typeof setIntervalImpl !== "function" || typeof clearIntervalImpl !== "function") {
    throw new TypeError("Garden binding requires interval scheduling");
  }
  if (!Array.isArray(feeds) || typeof onUpdate !== "function") {
    throw new TypeError("Garden binding requires feeds and an update handler");
  }

  let active = true;
  let refreshInFlight = null;
  const refresh = () => {
    if (!active) return Promise.resolve();
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = Promise.resolve(loadState())
      .then((gardenState) => {
        if (active) onUpdate(bindGardenComponent(gardenState, component, { feeds }));
      })
      .catch(onError)
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  };

  eventTarget.addEventListener(GARDEN_TICK_EVENT, refresh);
  const interval = setIntervalImpl(refresh, intervalMs);
  void refresh();

  return () => {
    active = false;
    eventTarget.removeEventListener(GARDEN_TICK_EVENT, refresh);
    clearIntervalImpl(interval);
  };
}