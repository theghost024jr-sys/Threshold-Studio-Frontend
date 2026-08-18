const BIOME_PATH = Object.freeze(["house", "garden", "forest", "deepforest", "root", "stone", "shadow"]);
const ADJACENCY_CAPACITY = 8;
export const GARDEN_RUNTIME_SMOOTHING_WINDOW = 0.15;

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(Math.max(Number.isFinite(value) ? value : minimum, minimum), maximum);
}

function growthStage(rate) {
  if (rate < 0.25) return "seeded";
  if (rate < 0.6) return "sprouting";
  if (rate < 0.85) return "branching";
  return "stable";
}

function pressureLevel(intensity) {
  if (intensity < 0.3) return "local";
  if (intensity < 0.7) return "moving";
  return "systemic";
}

function appendUnique(values = [], value) {
  return value && !values.includes(value) ? [...values, value] : [...values];
}

function lerp(previous, target, alpha) {
  return previous + (target - previous) * alpha;
}

function updateNumericDomain(previous, incoming, valueKey, alpha) {
  const source = incoming && typeof incoming === "object" ? incoming : { [valueKey]: incoming };
  const target = source[valueKey];
  const next = { ...previous, ...source };
  if (Number.isFinite(target)) next[valueKey] = lerp(clamp(previous?.[valueKey]), clamp(target), alpha);
  return next;
}

function updateBiomeShift(previous, incoming) {
  if (incoming && typeof incoming === "object") return { ...previous, ...incoming };
  if (typeof incoming !== "string" || incoming === previous?.to) return { ...previous };
  return { ...previous, from: previous?.to || previous?.from, to: incoming, progress: 0 };
}

function updateEnvironmentSignals(previous, incoming) {
  if (incoming && typeof incoming === "object") return { ...previous, ...incoming };
  if (typeof incoming !== "string") return { ...previous };
  return { ...previous, active: incoming === "quiet" ? [] : [incoming] };
}

function recordChange(changes, key, previous, next) {
  if (JSON.stringify(previous) !== JSON.stringify(next)) changes[key] = { old: previous, new: next };
}

export function updateGardenRuntime(gardenState, world, {
  smoothingWindow = GARDEN_RUNTIME_SMOOTHING_WINDOW
} = {}) {
  const environment = world?.environment;
  if (!environment || typeof environment !== "object") {
    throw new TypeError("Garden runtime requires world.environment");
  }

  const alpha = clamp(smoothingWindow);
  const state = structuredClone(gardenState);
  const changes = {};
  const domains = {
    growth: updateNumericDomain(state.growth, environment.growth, "rate", alpha),
    adjacency: updateNumericDomain(state.adjacency, environment.adjacency, "density", alpha),
    driftCapture: updateNumericDomain(state.driftCapture, environment.driftCapture, "rate", alpha),
    pressureSpread: updateNumericDomain(state.pressureSpread, environment.pressureSpread, "intensity", alpha),
    biomeShift: updateBiomeShift(state.biomeShift, environment.biomeShift),
    environmentSignals: updateEnvironmentSignals(state.environmentSignals, environment.signals)
  };

  for (const [key, next] of Object.entries(domains)) {
    recordChange(changes, key, state[key], next);
    state[key] = next;
  }
  state.runtimeTick = (state.runtimeTick || 0) + 1;

  return {
    state,
    delta: {
      id: "garden-runtime-delta",
      source: "garden-runtime-state.json",
      mode: "environment-tick",
      changes,
      diagnostics: {
        deltaApplied: Object.keys(changes).length > 0,
        noChangesDetected: Object.keys(changes).length === 0,
        status: "coherent"
      }
    }
  };
}

export function advanceGardenRuntime(gardenState, { tickSeconds = 12 } = {}) {
  const next = structuredClone(gardenState);
  const factor = Math.max(0, tickSeconds) / 12;
  const previousGrowthStage = next.growth.stage;
  const previousPressure = clamp(next.pressureSpread.intensity);
  const previousPressureLevel = pressureLevel(previousPressure);
  const previousCapturedNodes = Math.max(0, next.driftCapture.capturedNodes || 0);
  const stability = clamp(next.growth.stability, 0, 1) || 0.5;

  const growthDelta = ((stability * 0.012) - (previousPressure * 0.004)) * factor;
  next.growth.rate = clamp(clamp(next.growth.rate) + growthDelta);
  next.growth.stage = growthStage(next.growth.rate);

  next.driftCapture.rate = clamp(clamp(next.driftCapture.rate) + (next.growth.rate * 0.008 * factor));
  const availableNodes = Math.max(0, next.driftCapture.availableNodes || 0);
  const captureThreshold = availableNodes > 0 ? (previousCapturedNodes + 1) / availableNodes : 1;
  if (next.driftCapture.rate >= captureThreshold && previousCapturedNodes < availableNodes) {
    next.driftCapture.capturedNodes += 1;
  }

  const pressureDelta = ((next.growth.rate * 0.006) - (next.driftCapture.rate * 0.003)) * factor;
  next.pressureSpread.intensity = clamp(previousPressure + pressureDelta);

  if (next.growth.stage === "stable") {
    for (const chamber of next.growth.seededChambers || []) {
      next.adjacency.chambers = appendUnique(next.adjacency.chambers, chamber);
    }
  }
  next.adjacency.density = clamp((next.adjacency.chambers?.length || 0) / ADJACENCY_CAPACITY);
  next.adjacency.outerRingPetals = 13;

  const path = next.biomeShift.path?.length ? next.biomeShift.path : BIOME_PATH;
  const transitionRate = next.growth.rate * 0.01 * (1 - (next.pressureSpread.intensity * 0.35)) * factor;
  next.biomeShift.progress = clamp(next.biomeShift.progress + transitionRate, 0, 1);
  let biomeTransition = null;
  if (next.biomeShift.progress >= 1) {
    const currentIndex = Math.max(0, path.indexOf(next.biomeShift.to));
    const nextIndex = Math.min(currentIndex + 1, path.length - 1);
    next.biomeShift.from = next.biomeShift.to;
    next.biomeShift.to = path[nextIndex];
    next.biomeShift.progress = nextIndex === currentIndex ? 1 : 0;
    biomeTransition = `${next.biomeShift.from}:${next.biomeShift.to}`;
  }

  next.pressureSpread.affectedBiomes = appendUnique(next.pressureSpread.affectedBiomes, next.biomeShift.to);
  if (next.pressureSpread.intensity >= 0.7) {
    const biomeIndex = Math.max(0, path.indexOf(next.biomeShift.to));
    next.pressureSpread.affectedBiomes = appendUnique(
      next.pressureSpread.affectedBiomes,
      path[Math.min(biomeIndex + 1, path.length - 1)]
    );
  }

  const activeSignals = [];
  if (next.growth.stage !== previousGrowthStage) activeSignals.push(`growth:${next.growth.stage}`);
  if (next.driftCapture.capturedNodes > previousCapturedNodes) activeSignals.push("drift-captured");
  const currentPressureLevel = pressureLevel(next.pressureSpread.intensity);
  if (currentPressureLevel !== previousPressureLevel) activeSignals.push(`pressure:${currentPressureLevel}`);
  next.environmentSignals.active = activeSignals.length > 0 ? activeSignals : next.environmentSignals.active;
  if (biomeTransition) next.environmentSignals.transitions = appendUnique(next.environmentSignals.transitions, biomeTransition);
  next.runtimeTick = (next.runtimeTick || 0) + 1;
  return next;
}