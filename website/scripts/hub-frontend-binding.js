const HUB_RUNTIME_STATE_URL = "/runtime/hub/hub-runtime-state.json";
const HUB_TICK_EVENT = "threshold:heartbeat-field";
export const HUB_TICK_INTERVAL_MS = 12000;
const COMPONENT_METHODS = [
  "setEngine",
  "setBiome",
  "setChambers",
  "setSignals",
  "setPlayer",
  "setVisual",
  "setNavigation"
];

export async function loadHubState({
  fetchImpl = globalThis.fetch,
  url = HUB_RUNTIME_STATE_URL
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError("Hub binding requires a fetch implementation");
  }

  const response = await fetchImpl(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Hub runtime state unavailable (${response.status})`);
  }
  return response.json();
}

function assertComponent(component) {
  const missing = COMPONENT_METHODS.filter((method) => typeof component?.[method] !== "function");
  if (missing.length > 0) {
    throw new TypeError(`Hub component is missing: ${missing.join(", ")}`);
  }
}

export function bindHubComponent(hubState, component) {
  assertComponent(component);

  component.setEngine({
    drift: hubState.engine.drift,
    pressure: hubState.engine.pressure,
    cycle: hubState.engine.cycle,
    cyclePosition: hubState.engine.cyclePosition,
    worldState: hubState.engine.worldState
  });
  component.setBiome({
    current: hubState.biome.current,
    color: hubState.biome.color,
    palette: hubState.biome.palette
  });
  component.setChambers({
    adjacent: hubState.chambers.adjacent,
    reachable: hubState.chambers.reachable,
    recent: hubState.chambers.recent
  });
  component.setSignals({
    active: hubState.signals.active,
    warnings: hubState.signals.warnings,
    distortions: hubState.signals.distortions,
    environmental: hubState.signals.environmental
  });
  component.setPlayer({
    role: hubState.player.role,
    state: hubState.player.state,
    location: hubState.player.location
  });
  component.setVisual({
    asset: hubState.visual.asset,
    assetExists: hubState.visual.assetExists,
    fallback: hubState.visual.fallback,
    pulse: hubState.visual.pulse
  });
  component.setNavigation({
    routes: hubState.navigation.routes,
    mode: hubState.navigation.mode
  });
}

export function startHubBinding(component, {
  eventTarget = globalThis.window,
  loadState = loadHubState,
  onError = (error) => console.error("Hub binding error:", error),
  setIntervalImpl = globalThis.setInterval,
  clearIntervalImpl = globalThis.clearInterval,
  intervalMs = HUB_TICK_INTERVAL_MS
} = {}) {
  assertComponent(component);
  if (typeof eventTarget?.addEventListener !== "function") {
    throw new TypeError("Hub binding requires an event target");
  }
  if (typeof setIntervalImpl !== "function" || typeof clearIntervalImpl !== "function") {
    throw new TypeError("Hub binding requires interval scheduling");
  }

  let active = true;
  let refreshInFlight = null;

  const refresh = () => {
    if (!active) return Promise.resolve();
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = Promise.resolve(loadState())
      .then((hubState) => {
        if (active) bindHubComponent(hubState, component);
      })
      .catch(onError)
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  };

  eventTarget.addEventListener(HUB_TICK_EVENT, refresh);
  const interval = setIntervalImpl(refresh, intervalMs);
  void refresh();

  return () => {
    active = false;
    eventTarget.removeEventListener(HUB_TICK_EVENT, refresh);
    clearIntervalImpl(interval);
  };
}