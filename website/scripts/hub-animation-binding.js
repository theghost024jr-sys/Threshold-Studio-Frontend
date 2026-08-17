import calibration from "./hub-feed-calibration.json" with { type: "json" };

export const HUB_FEED_CALIBRATION = calibration;

const ANIMATION_NUMBER_KEYS = [
  "cycleSeconds",
  "coreMinScale",
  "coreMaxScale",
  "haloLowOpacity",
  "haloMidOpacity",
  "haloHighOpacity",
  "haloSeconds",
  "haloStrokeWidth",
  "biomeSeconds",
  "biomeDelaySeconds",
  "adjacencyNormalized"
];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function hasSignal(values) {
  return Array.isArray(values) && values.length > 0;
}

function countSignals(signals) {
  if (Array.isArray(signals)) return signals.length;
  return ["active", "warnings", "distortions", "environmental"]
    .reduce((total, key) => total + (Array.isArray(signals?.[key]) ? signals[key].length : 0), 0);
}

function driftLevel(value) {
  if (value < calibration.ranges.drift.levels.low[1]) return "low";
  if (value < calibration.ranges.drift.levels.medium[1]) return "medium";
  return "high";
}

function pressureLevel(value) {
  if (value < calibration.ranges.pressure.levels.soft[1]) return "soft";
  if (value < calibration.ranges.pressure.levels.tense[1]) return "tense";
  return "critical";
}

function signalMode(signals) {
  if (typeof signals === "string" && Object.hasOwn(calibration.signalBurstRules, signals)) return signals;
  if (hasSignal(signals?.warnings) || hasSignal(signals?.distortions)) return "burst";
  if (countSignals(signals) > 0) return "pulse";
  return "quiet";
}

function normalizedAdjacency(adjacency) {
  if (typeof adjacency === "number" && Number.isFinite(adjacency)) return clamp(adjacency, 0, 1);
  if (Array.isArray(adjacency)) {
    return clamp(adjacency.length / calibration.ranges.adjacency.arrayNormalizationMaximum, 0, 1);
  }
  return 0;
}

export function lerp(previousValue, newValue, alpha = calibration.smoothing.alpha) {
  return previousValue + (newValue - previousValue) * alpha;
}

export function hubAnimationState({ cycle, drift, pressure, adjacency = [], signals = {} } = {}) {
  const normalizedDrift = Number.isFinite(drift) ? clamp(drift, ...calibration.ranges.drift.input) : 0;
  const normalizedPressure = Number.isFinite(pressure) ? clamp(pressure, ...calibration.ranges.pressure.input) : 0;
  const currentDriftLevel = driftLevel(normalizedDrift);
  const currentPressureLevel = pressureLevel(normalizedPressure);
  const adjacencyNormalized = normalizedAdjacency(adjacency);
  const currentSignalMode = signalMode(signals);
  const [coreMinScale, coreMaxScale] = calibration.curves.driftCorePulse[currentDriftLevel];
  const [haloLow, haloHigh] = calibration.curves.pressureHaloOpacity[currentPressureLevel];
  const signalRule = calibration.signalBurstRules[currentSignalMode];
  const haloLowOpacity = clamp(haloLow + signalRule.opacityBoost, 0, 1);
  const haloHighOpacity = clamp(haloHigh + signalRule.opacityBoost, 0, 1);

  return {
    cycleSeconds: calibration.curves.cycleSeconds[cycle] || calibration.curves.cycleSeconds.early,
    driftLevel: currentDriftLevel,
    coreMinScale,
    coreMaxScale,
    pressureLevel: currentPressureLevel,
    haloLowOpacity,
    haloMidOpacity: (haloLowOpacity + haloHighOpacity) / 2,
    haloHighOpacity,
    haloSeconds: signalRule.haloSeconds,
    haloStrokeWidth: signalRule.strokeWidth,
    biomeSeconds: lerp(...calibration.adjacencyModulation.biomeRotationSeconds, adjacencyNormalized),
    biomeDelaySeconds: lerp(...calibration.adjacencyModulation.phaseOffsetSeconds, adjacencyNormalized),
    adjacencyNormalized,
    signalMode: currentSignalMode
  };
}

export function smoothHubAnimation(previous, target, alpha = calibration.smoothing.alpha) {
  if (!previous) return { ...target };
  const smoothed = { ...target };
  for (const key of ANIMATION_NUMBER_KEYS) {
    smoothed[key] = lerp(previous[key], target[key], alpha);
  }
  return smoothed;
}

export function animationSettled(current, target) {
  return ANIMATION_NUMBER_KEYS.every((key) => (
    Math.abs(current[key] - target[key]) <= calibration.smoothing.settleEpsilon
  ));
}

function applyAnimationState({ core, halo, cycleRing, biomeRing }, animation) {
  cycleRing?.style.setProperty("animation-duration", `${animation.cycleSeconds.toFixed(3)}s`);
  core?.style.setProperty("--hub-core-min-scale", animation.coreMinScale.toFixed(3));
  core?.style.setProperty("--hub-core-max-scale", animation.coreMaxScale.toFixed(3));
  biomeRing?.style.setProperty("animation-duration", `${animation.biomeSeconds.toFixed(3)}s`);
  biomeRing?.style.setProperty("animation-delay", `${animation.biomeDelaySeconds.toFixed(3)}s`);
  halo?.style.setProperty("--hub-halo-low-opacity", animation.haloLowOpacity.toFixed(3));
  halo?.style.setProperty("--hub-halo-mid-opacity", animation.haloMidOpacity.toFixed(3));
  halo?.style.setProperty("--hub-halo-high-opacity", animation.haloHighOpacity.toFixed(3));
  halo?.style.setProperty("animation-duration", `${animation.haloSeconds.toFixed(3)}s`);
  halo?.style.setProperty("stroke-width", `${animation.haloStrokeWidth.toFixed(3)}px`);

  if (core) {
    core._scale = animation.coreMaxScale;
    core.dataset.drift = animation.driftLevel;
  }
  if (biomeRing) {
    biomeRing._scale = animation.adjacencyNormalized;
    biomeRing.dataset.adjacency = animation.adjacencyNormalized.toFixed(3);
  }
  if (halo) {
    halo._opacity = animation.haloHighOpacity;
    halo.dataset.pressure = animation.pressureLevel;
    halo.dataset.signals = animation.signalMode;
  }
  return animation;
}

export function applyHubCalibration(engine, elements, previous = null, alpha = 1) {
  const target = hubAnimationState(engine);
  return applyAnimationState(elements, smoothHubAnimation(previous, target, alpha));
}

export function applyHubAnimation(svg, animation) {
  return applyAnimationState({
    core: svg?.querySelector?.(calibration.targets.core),
    halo: svg?.querySelector?.(calibration.targets.halo),
    cycleRing: svg?.querySelector?.(calibration.targets.cycle),
    biomeRing: svg?.querySelector?.(calibration.targets.biome)
  }, animation);
}

export function updateHubAnimation(svg, feeds, previous = null, alpha = 1) {
  return applyHubCalibration(feeds, {
    core: svg?.querySelector?.(calibration.targets.core),
    halo: svg?.querySelector?.(calibration.targets.halo),
    cycleRing: svg?.querySelector?.(calibration.targets.cycle),
    biomeRing: svg?.querySelector?.(calibration.targets.biome)
  }, previous, alpha);
}
