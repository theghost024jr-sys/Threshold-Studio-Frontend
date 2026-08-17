import calibration from "./garden-feed-calibration.json" with { type: "json" };

export const GARDEN_FEED_CALIBRATION = calibration;

const ANIMATION_NUMBER_KEYS = [
  "growthScale",
  "petalScale",
  "adjacencySeconds",
  "adjacencyNormalized",
  "driftSeconds",
  "driftOpacity",
  "pressureOpacity",
  "pressureStrokeWidth",
  "biomeOpacity",
  "biomeProgress",
  "signalOpacity",
  "signalSeconds",
  "signalStrokeWidth"
];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function finiteValue(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function levelFor(value, levels) {
  const entries = Object.entries(levels);
  return entries.find(([, range], index) => value < range[1] || index === entries.length - 1)?.[0];
}

function signalCount(signals) {
  return ["active", "warnings", "transitions"]
    .reduce((total, key) => total + (Array.isArray(signals?.[key]) ? signals[key].length : 0), 0);
}

function signalMode(signals) {
  if (typeof signals === "string" && Object.hasOwn(calibration.signalRules, signals)) return signals;
  if ((signals?.warnings?.length || 0) > 0) return "burst";
  return signalCount(signals) > 0 ? "pulse" : "quiet";
}

function normalizedAdjacency(adjacency) {
  if (Number.isFinite(adjacency?.density)) return clamp(adjacency.density, 0, 1);
  if (Array.isArray(adjacency?.chambers)) {
    return clamp(adjacency.chambers.length / calibration.ranges.adjacency.arrayNormalizationMaximum, 0, 1);
  }
  if (Number.isFinite(adjacency)) return clamp(adjacency, 0, 1);
  return 0;
}

export function lerp(previousValue, newValue, alpha = calibration.smoothing.alpha) {
  return previousValue + (newValue - previousValue) * alpha;
}

export function gardenAnimationState(feeds = {}) {
  const growth = clamp(finiteValue(feeds.growth?.rate, finiteValue(feeds.growth)), 0, 1);
  const adjacencyNormalized = normalizedAdjacency(feeds.adjacency);
  const driftCapture = clamp(finiteValue(feeds["drift-capture"]?.rate, finiteValue(feeds["drift-capture"])), 0, 1);
  const pressureSpread = clamp(finiteValue(feeds["pressure-spread"]?.intensity, finiteValue(feeds["pressure-spread"])), 0, 1);
  const biomeProgress = clamp(finiteValue(feeds["biome-shift"]?.progress), 0, 1);
  const growthLevel = levelFor(growth, calibration.ranges.growth.levels);
  const pressureLevel = levelFor(pressureSpread, calibration.ranges.pressureSpread.levels);
  const currentSignalMode = signalMode(feeds["environment-signals"]);
  const signalRule = calibration.signalRules[currentSignalMode];
  const fromBiome = feeds["biome-shift"]?.from || calibration.ranges.biomeShift.path[0];
  const toBiome = feeds["biome-shift"]?.to || fromBiome;
  const biome = biomeProgress >= 0.5 ? toBiome : fromBiome;

  return {
    growthScale: lerp(...calibration.curves.growthCoreScale, growth),
    petalScale: lerp(...calibration.curves.growthPetalScale, growth),
    growthLevel,
    adjacencySeconds: lerp(...calibration.curves.adjacencyRotationSeconds, adjacencyNormalized),
    adjacencyNormalized,
    driftSeconds: lerp(...calibration.curves.driftArcSeconds, driftCapture),
    driftOpacity: lerp(...calibration.curves.driftArcOpacity, driftCapture),
    pressureOpacity: lerp(...calibration.curves.pressureRingOpacity, pressureSpread),
    pressureStrokeWidth: lerp(...calibration.curves.pressureStrokeWidth, pressureSpread),
    pressureLevel,
    biomeOpacity: lerp(...calibration.curves.biomePetalOpacity, biomeProgress),
    biomeProgress,
    biome,
    biomeColor: calibration.biomePalette[biome] || calibration.biomePalette.garden,
    signalOpacity: clamp(0.28 + signalRule.opacityBoost, 0, 1),
    signalSeconds: signalRule.durationSeconds,
    signalStrokeWidth: signalRule.strokeWidth,
    signalMode: currentSignalMode
  };
}

export function smoothGardenAnimation(previous, target, alpha = calibration.smoothing.alpha) {
  if (!previous) return { ...target };
  const smoothed = { ...target };
  for (const key of ANIMATION_NUMBER_KEYS) {
    smoothed[key] = lerp(previous[key], target[key], alpha);
  }
  return smoothed;
}

export function gardenAnimationSettled(current, target) {
  return ANIMATION_NUMBER_KEYS.every((key) => (
    Math.abs(current[key] - target[key]) <= calibration.smoothing.settleEpsilon
  ));
}

function applyAnimationState(elements, animation) {
  elements.growth?.style.setProperty("--garden-growth-scale", animation.growthScale.toFixed(3));
  elements.biomeShift?.style.setProperty("--garden-petal-scale", animation.petalScale.toFixed(3));
  elements.biomeShift?.style.setProperty("--garden-biome-color", animation.biomeColor);
  elements.biomeShift?.style.setProperty("opacity", animation.biomeOpacity.toFixed(3));
  elements.adjacency?.style.setProperty("animation-duration", `${animation.adjacencySeconds.toFixed(3)}s`);
  elements.driftCapture?.style.setProperty("animation-duration", `${animation.driftSeconds.toFixed(3)}s`);
  elements.driftCapture?.style.setProperty("opacity", animation.driftOpacity.toFixed(3));
  elements.pressureSpread?.style.setProperty("opacity", animation.pressureOpacity.toFixed(3));
  elements.pressureSpread?.style.setProperty("stroke-width", `${animation.pressureStrokeWidth.toFixed(3)}px`);
  elements.environmentSignals?.style.setProperty("animation-duration", `${animation.signalSeconds.toFixed(3)}s`);
  elements.environmentSignals?.style.setProperty("opacity", animation.signalOpacity.toFixed(3));
  elements.environmentSignals?.style.setProperty("stroke-width", `${animation.signalStrokeWidth.toFixed(3)}px`);

  if (elements.growth) {
    elements.growth._scale = animation.growthScale;
    elements.growth.dataset.growth = animation.growthLevel;
  }
  if (elements.adjacency) elements.adjacency.dataset.density = animation.adjacencyNormalized.toFixed(3);
  if (elements.driftCapture) elements.driftCapture.dataset.capture = animation.driftOpacity.toFixed(3);
  if (elements.pressureSpread) elements.pressureSpread.dataset.pressure = animation.pressureLevel;
  if (elements.biomeShift) {
    elements.biomeShift._scale = animation.petalScale;
    elements.biomeShift.dataset.biome = animation.biome;
    elements.biomeShift.dataset.progress = animation.biomeProgress.toFixed(3);
  }
  if (elements.environmentSignals) elements.environmentSignals.dataset.signals = animation.signalMode;
  return animation;
}

function gardenElements(svg) {
  return {
    growth: svg?.querySelector?.(calibration.targets.growth),
    adjacency: svg?.querySelector?.(calibration.targets.adjacency),
    driftCapture: svg?.querySelector?.(calibration.targets.driftCapture),
    pressureSpread: svg?.querySelector?.(calibration.targets.pressureSpread),
    biomeShift: svg?.querySelector?.(calibration.targets.biomeShift),
    environmentSignals: svg?.querySelector?.(calibration.targets.environmentSignals)
  };
}

export function applyGardenCalibration(feeds, elements, previous = null, alpha = 1) {
  const target = gardenAnimationState(feeds);
  return applyAnimationState(elements, smoothGardenAnimation(previous, target, alpha));
}

export function applyGardenAnimation(svg, animation) {
  return applyAnimationState(gardenElements(svg), animation);
}

export function updateGardenAnimation(svg, feeds, previous = null, alpha = 1) {
  return applyGardenCalibration(feeds, gardenElements(svg), previous, alpha);
}