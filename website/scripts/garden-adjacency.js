export const GARDEN_ADJACENCY_NEIGHBORS = Object.freeze([
  "herbroom",
  "basin",
  "waterfall",
  "forest"
]);

const PROPAGATION_WEIGHTS = Object.freeze({
  stability: 0.25,
  coherence: 0.2,
  tension: 0.3,
  drift: 0.15
});

function finiteValue(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function lerp(previous, target, alpha) {
  return previous + (target - previous) * alpha;
}

function influenceFrom(gardenState) {
  return {
    stability: finiteValue(gardenState?.growth?.stability),
    coherence: finiteValue(gardenState?.adjacency?.density),
    tension: finiteValue(gardenState?.pressureSpread?.intensity),
    drift: finiteValue(gardenState?.driftCapture?.rate),
    biome: gardenState?.biomeShift?.to || gardenState?.biomeShift?.from || null,
    signal: structuredClone(gardenState?.environmentSignals ?? null)
  };
}

export function propagateGardenAdjacency(world, gardenState, {
  neighbors = GARDEN_ADJACENCY_NEIGHBORS
} = {}) {
  if (!world?.chambers || typeof world.chambers !== "object") {
    throw new TypeError("Garden adjacency propagation requires world.chambers");
  }

  const nextWorld = structuredClone(world);
  const influence = influenceFrom(gardenState);

  for (const id of neighbors) {
    const chamber = nextWorld.chambers[id];
    if (!chamber) continue;

    const previous = chamber.environment ?? {};
    const environment = { ...previous };
    for (const [field, weight] of Object.entries(PROPAGATION_WEIGHTS)) {
      environment[field] = lerp(finiteValue(previous[field]), influence[field], weight);
    }
    environment.biome = influence.biome;
    environment.signal = structuredClone(influence.signal);

    chamber.environment = environment;
    chamber.environmentDelta = {
      stability: environment.stability - finiteValue(previous.stability),
      coherence: environment.coherence - finiteValue(previous.coherence),
      tension: environment.tension - finiteValue(previous.tension),
      drift: environment.drift - finiteValue(previous.drift),
      biome: previous.biome !== environment.biome,
      signal: JSON.stringify(previous.signal ?? null) !== JSON.stringify(environment.signal)
    };
  }

  return nextWorld;
}