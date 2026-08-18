const TIMING = {
  DEBOUNCE_LOCK: 300,
  FADE_DURATION: 600,
  GLYPH_SPAWN_START: 400,
  COLOR_INVERT_START: 600,
  SPIN_START: 700,
  OVERLAY_LIFT: 1100,
  LABEL_APPEAR: 1400,
  FINAL_STATE: 1700,
  CONTINUE_APPEAR: 2000,
  DIAMOND_FADE_START: 2200,
  DIAMOND_REMOVE: 4200,
};

const PATH_KEY = "thresholdPath";
const PATH_META = {
  wake: {
    name: "The Wake",
    continueHref: "discover.html",
    background: "#FFFFFF",
    spinDirection: 1,
    inwardPulse: false,
  },
  fold: {
    name: "The Fold",
    continueHref: "mythology.html",
    background: "#000000",
    spinDirection: -1,
    inwardPulse: true,
  },
  spire: {
    name: "The Spire",
    continueHref: "ethos.html",
    background: "#0C121B",
    spinDirection: 1,
    inwardPulse: false,
  },
};

const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const page = document.body;
const hubA = document.getElementById("hub-a");
const hubB = document.getElementById("hub-b");
const hubC = document.getElementById("hub-c");
const overlay = document.querySelector(".hub-overlay");
const glyphLayer = document.getElementById("glyph-layer");
const labelA = document.getElementById("hub-label-a");
const labelB = document.getElementById("hub-label-b");
const labelC = document.getElementById("hub-label-c");
const continueLink = document.getElementById("hub-continue");
const live = document.getElementById("hub-live");
const logoTriggers = Array.from(document.querySelectorAll(".hub-logo-trigger"));
const seedLogo = document.querySelector(".hub-seed-logo");
const spaceLayer = document.getElementById("space-layer");
const diamondField = document.querySelector(".diamond-field");
const diamondCornerNE = document.querySelector(".diamond-corner-ne");
const diamondCornerSE = document.querySelector(".diamond-corner-se");
const diamondCornerNW = document.querySelector(".diamond-corner-nw");
const diamondCornerSW = document.querySelector(".diamond-corner-sw");
const strandWake = document.querySelector(".hub-strand-wake");
const strandFold = document.querySelector(".hub-strand-fold");
const strandSpire = document.querySelector(".hub-strand-spire");
const overlayWake = document.querySelector(".hub-logo-top-left");
const overlayFold = document.querySelector(".hub-logo-top-right");
const overlaySpire = document.querySelector(".hub-logo-bottom-left");
const strandChoices = Array.from(document.querySelectorAll(".hub-strand[data-hub-target]"));
const telemetryMatrix = document.getElementById("telemetry-matrix");
const telemetryWaveA = document.getElementById("telemetry-wave-a");
const telemetryWaveB = document.getElementById("telemetry-wave-b");
const telemetryPath = document.getElementById("telemetry-path");
const telemetryEnergy = document.getElementById("telemetry-energy");
const calibrationControls = {
  innerSpeed: document.getElementById("cal-inner-speed"),
  innerVolume: document.getElementById("cal-inner-volume"),
  outerSpeed: document.getElementById("cal-outer-speed"),
  outerVolume: document.getElementById("cal-outer-volume"),
  damping: document.getElementById("cal-damping"),
  pullCap: document.getElementById("cal-pull-cap"),
  scaleCap: document.getElementById("cal-scale-cap"),
  retireStart: document.getElementById("cal-retire-start"),
  retireEnd: document.getElementById("cal-retire-end"),
  reset: document.getElementById("cal-reset"),
};

const calibrationOutputs = {
  innerSpeed: document.getElementById("cal-out-inner-speed"),
  innerVolume: document.getElementById("cal-out-inner-volume"),
  outerSpeed: document.getElementById("cal-out-outer-speed"),
  outerVolume: document.getElementById("cal-out-outer-volume"),
  damping: document.getElementById("cal-out-damping"),
  pullCap: document.getElementById("cal-out-pull-cap"),
  scaleCap: document.getElementById("cal-out-scale-cap"),
  retireStart: document.getElementById("cal-out-retire-start"),
  retireEnd: document.getElementById("cal-out-retire-end"),
};

const glyphSet = Array.isArray(window.__thresholdHubGlyphSet)
  ? window.__thresholdHubGlyphSet
  : ["✦", "✧", "✶", "✹", "✺", "✷", "❋", "❈", "✵", "⊹", "✴", "◊"];

let hubActivated = false;
let debounceUntil = 0;
let seedTimer = null;
let spaceParticles = [];
let spaceAnimationHandle = null;
let lastSpaceTick = 0;
let diamondPullAnimationHandle = null;
let diamondFadeTimer = null;
let diamondRemoveTimer = null;
let lastDiamondTick = 0;

const smoothedPulse = {
  inner: 0,
  outer: 0,
  blend: 0,
};

// --- String-fabric void: Echo-Lake binding ---
const playerState = {
  atVoidBoundary: false,
  // Burdens are the resonant words the lake recognises — drawn from the echo-blocks.
  burdens: ["pattern", "assignment", "resonance", "choice", "rewrite", "truth",
            "coherence", "alignment", "pulse", "meaning", "presence", "weight",
            "drift", "tension", "vibration", "echo", "release", "movement"],
  correctStone: null,
};

function bindEchoToVoid() {
  const lake = document.getElementById("echo-lake");
  if (lake && playerState.atVoidBoundary === true) {
    lake.classList.remove("hidden");
    lake.classList.add("active");
    const trigger = document.querySelector(".echo-trigger");
    if (trigger) { trigger.style.display = "none"; }
    const locator = document.getElementById("stone-locator");
    const cast = document.getElementById("stone-cast");
    if (locator) { locator.classList.remove("hidden"); locator.classList.add("active"); }
    if (cast) { cast.classList.remove("hidden"); cast.classList.add("active"); }
  }
}

function senseVoidBoundary(pulse) {
  // A pulse entering the void becomes a vibration.
  // No echo, no shimmer, no reaction — only drift.
  const drift = Math.abs(pulse.blend);
  const tension = Math.abs(pulse.inner);
  const vibration = Math.abs(pulse.outer);

  // The void is sensed when drift is low, tension is soft, vibration is faint.
  if (!playerState.atVoidBoundary && drift < 0.2 && tension < 0.3 && vibration < 0.4) {
    playerState.atVoidBoundary = true;
    bindEchoToVoid();
  }
}

function locateStone() {
  const input = document.getElementById("stone-search");
  const feedback = document.getElementById("stone-feedback");
  if (!input || !feedback) return;
  const query = input.value.trim();
  if (!query) return;

  // The stone echoes with the player if it matches their internal state.
  const echoMatch = playerState.burdens.includes(query.toLowerCase());

  if (echoMatch) {
    feedback.textContent = `"${query}" echoes with you. The lake will accept this stone.`;
    playerState.correctStone = query;
  } else {
    feedback.textContent = `"${query}" does not echo with you. The lake remains still.`;
    playerState.correctStone = null;
  }
  feedback.classList.remove("hidden");
  feedback.classList.add("active");
}

function castStone() {
  const burden = playerState.correctStone;
  const result = document.getElementById("stone-result");
  if (!result) return;

  if (!burden) {
    result.textContent = "The lake refuses the stone. It carries no echo.";
  } else {
    result.textContent =
      `The lake accepts "${burden}" and carries its weight into the fog. ` +
      "Your shoulders lighten. The burden dissolves beneath the surface.";
    playerState.correctStone = null;
    // Remove the cast burden from the recognised list so it cannot be re-cast.
    playerState.burdens = playerState.burdens.filter(b => b !== burden.toLowerCase());
    const input = document.getElementById("stone-search");
    if (input) { input.value = ""; }
    const feedback = document.getElementById("stone-feedback");
    if (feedback) { feedback.classList.add("hidden"); feedback.classList.remove("active"); }
  }
  result.classList.remove("hidden");
  result.classList.add("active");
}

// Expose to inline onclick handlers in hub.html
window.locateStone = locateStone;
window.castStone = castStone;
// --- End void binding ---

const SPACE_CONFIG = {
  orbCount: REDUCED_MOTION ? 10 : 18,
  glyphCount: REDUCED_MOTION ? 8 : 14,
  speedFactor: REDUCED_MOTION ? 0.4 : 1,
};

const MATRIX_OSC = {
  inner: {
    speed: REDUCED_MOTION ? 0.36 : 0.58,
    volume: REDUCED_MOTION ? 0.55 : 1.0,
    phase: 0.0,
  },
  outer: {
    speed: REDUCED_MOTION ? 0.72 : 1.32,
    volume: REDUCED_MOTION ? 0.35 : 0.7,
    phase: 1.7,
  },
};

const DEFAULT_TUNE = {
  innerSpeed: MATRIX_OSC.inner.speed,
  innerVolume: MATRIX_OSC.inner.volume,
  outerSpeed: MATRIX_OSC.outer.speed,
  outerVolume: MATRIX_OSC.outer.volume,
  damping: REDUCED_MOTION ? 0.12 : 0.2,
  pullCap: REDUCED_MOTION ? 85 : 160,
  scaleCap: REDUCED_MOTION ? 0.45 : 0.9,
  retireStart: TIMING.DIAMOND_FADE_START,
  retireEnd: TIMING.DIAMOND_REMOVE,
};

const engineTune = { ...DEFAULT_TUNE };

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomGlyph() {
  return glyphSet[Math.floor(Math.random() * glyphSet.length)] || "✶";
}

function centerFromRect(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}

function parseStyleNumber(node, prop, fallback = 0) {
  const raw = node.style.getPropertyValue(prop);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dampToward(current, target, factor) {
  return current + ((target - current) * factor);
}

function stepToward(current, target, maxDelta) {
  if (!Number.isFinite(maxDelta) || maxDelta <= 0) return target;
  const delta = target - current;
  if (Math.abs(delta) <= maxDelta) return target;
  return current + (Math.sign(delta) * maxDelta);
}

function setSteppedVar(node, prop, target, unit, maxDelta, fallback = 0) {
  const current = parseStyleNumber(node, prop, fallback);
  const next = stepToward(current, target, maxDelta);
  node.style.setProperty(prop, `${next.toFixed(4)}${unit}`);
  return next;
}

function readCalibrationValue(input, fallback) {
  if (!input) return fallback;
  const parsed = Number.parseFloat(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function syncCalibrationOutputs() {
  if (calibrationOutputs.innerSpeed) calibrationOutputs.innerSpeed.textContent = engineTune.innerSpeed.toFixed(2);
  if (calibrationOutputs.innerVolume) calibrationOutputs.innerVolume.textContent = engineTune.innerVolume.toFixed(2);
  if (calibrationOutputs.outerSpeed) calibrationOutputs.outerSpeed.textContent = engineTune.outerSpeed.toFixed(2);
  if (calibrationOutputs.outerVolume) calibrationOutputs.outerVolume.textContent = engineTune.outerVolume.toFixed(2);
  if (calibrationOutputs.damping) calibrationOutputs.damping.textContent = engineTune.damping.toFixed(2);
  if (calibrationOutputs.pullCap) calibrationOutputs.pullCap.textContent = Math.round(engineTune.pullCap).toString();
  if (calibrationOutputs.scaleCap) calibrationOutputs.scaleCap.textContent = engineTune.scaleCap.toFixed(2);
  if (calibrationOutputs.retireStart) calibrationOutputs.retireStart.textContent = Math.round(engineTune.retireStart).toString();
  if (calibrationOutputs.retireEnd) calibrationOutputs.retireEnd.textContent = Math.round(engineTune.retireEnd).toString();
}

function applyTuneFromControls() {
  engineTune.innerSpeed = readCalibrationValue(calibrationControls.innerSpeed, DEFAULT_TUNE.innerSpeed);
  engineTune.innerVolume = readCalibrationValue(calibrationControls.innerVolume, DEFAULT_TUNE.innerVolume);
  engineTune.outerSpeed = readCalibrationValue(calibrationControls.outerSpeed, DEFAULT_TUNE.outerSpeed);
  engineTune.outerVolume = readCalibrationValue(calibrationControls.outerVolume, DEFAULT_TUNE.outerVolume);
  engineTune.damping = clamp(0.04, readCalibrationValue(calibrationControls.damping, DEFAULT_TUNE.damping), 0.4);
  engineTune.pullCap = clamp(40, readCalibrationValue(calibrationControls.pullCap, DEFAULT_TUNE.pullCap), 420);
  engineTune.scaleCap = clamp(0.2, readCalibrationValue(calibrationControls.scaleCap, DEFAULT_TUNE.scaleCap), 2.2);
  engineTune.retireStart = clamp(300, readCalibrationValue(calibrationControls.retireStart, DEFAULT_TUNE.retireStart), 8000);
  const minRetireEnd = engineTune.retireStart + 300;
  engineTune.retireEnd = clamp(minRetireEnd, readCalibrationValue(calibrationControls.retireEnd, DEFAULT_TUNE.retireEnd), 12000);
  syncCalibrationOutputs();
}

function setCalibrationControlsFromTune() {
  if (calibrationControls.innerSpeed) calibrationControls.innerSpeed.value = engineTune.innerSpeed.toFixed(2);
  if (calibrationControls.innerVolume) calibrationControls.innerVolume.value = engineTune.innerVolume.toFixed(2);
  if (calibrationControls.outerSpeed) calibrationControls.outerSpeed.value = engineTune.outerSpeed.toFixed(2);
  if (calibrationControls.outerVolume) calibrationControls.outerVolume.value = engineTune.outerVolume.toFixed(2);
  if (calibrationControls.damping) calibrationControls.damping.value = engineTune.damping.toFixed(2);
  if (calibrationControls.pullCap) calibrationControls.pullCap.value = Math.round(engineTune.pullCap).toString();
  if (calibrationControls.scaleCap) calibrationControls.scaleCap.value = engineTune.scaleCap.toFixed(2);
  if (calibrationControls.retireStart) calibrationControls.retireStart.value = Math.round(engineTune.retireStart).toString();
  if (calibrationControls.retireEnd) calibrationControls.retireEnd.value = Math.round(engineTune.retireEnd).toString();
}

function wireCalibrationPanel() {
  const controls = Object.values(calibrationControls).filter((el) => el && el !== calibrationControls.reset);
  if (controls.length === 0) return;

  setCalibrationControlsFromTune();
  syncCalibrationOutputs();

  controls.forEach((control) => {
    control.addEventListener("input", applyTuneFromControls);
    control.addEventListener("change", applyTuneFromControls);
  });

  calibrationControls.reset?.addEventListener("click", () => {
    Object.assign(engineTune, DEFAULT_TUNE);
    setCalibrationControlsFromTune();
    syncCalibrationOutputs();
  });
}

function applyOverlayPull(node, targetPoint, strength, phase, dt = 0.016) {
  if (!node || !targetPoint) return;

  const nodeRect = node.getBoundingClientRect();
  const nodeCenter = centerFromRect(nodeRect);
  const dx = targetPoint.x - nodeCenter.x;
  const dy = targetPoint.y - nodeCenter.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  const breath = 0.72 + Math.sin(phase) * 0.28;
  const pull = strength * breath;
  const px = nx * pull;
  const py = ny * pull;
  const tilt = (nx * 3.2) + (Math.sin(phase * 0.6) * 0.8);

  const pullStepCap = engineTune.pullCap * dt;
  const rotStepCap = Math.max(0.8, engineTune.pullCap * 1.2 * dt);
  setSteppedVar(node, "--overlay-pull-x", px, "px", pullStepCap);
  setSteppedVar(node, "--overlay-pull-y", py, "px", pullStepCap);
  setSteppedVar(node, "--overlay-rot", tilt, "deg", rotStepCap);
}

function applyHubPull(hub, targetPoint, strength, phase, dt = 0.016) {
  if (!hub || !targetPoint) return;

  const hubRect = hub.getBoundingClientRect();
  const hubCenter = centerFromRect(hubRect);
  const dx = targetPoint.x - hubCenter.x;
  const dy = targetPoint.y - hubCenter.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist;

  const breath = 0.72 + Math.sin(phase) * 0.28;
  const pull = strength * breath;
  const px = nx * pull;
  const py = ny * pull;
  const tilt = (nx * 2.2) + (Math.sin(phase * 0.6) * 0.6);

  const pullStepCap = engineTune.pullCap * dt;
  const rotStepCap = Math.max(0.8, engineTune.pullCap * 1.2 * dt);
  setSteppedVar(hub, "--hub-pull-x", px, "px", pullStepCap);
  setSteppedVar(hub, "--hub-pull-y", py, "px", pullStepCap);
  setSteppedVar(hub, "--hub-rot", tilt, "deg", rotStepCap);
}

function applyHubBreath(hub, pulseValue, phase, isEmphasized, dt = 0.016) {
  if (!hub) return;

  const inhale = Math.sin(phase * 1.07) * 0.032;
  const wave = pulseValue * 0.038;
  const emphasisBoost = isEmphasized ? 0.022 : 0;
  const hubScale = Math.max(0.86, Math.min(1.18, 1 + inhale + wave + emphasisBoost));

  const coreShiftX = Math.sin(phase * 1.22) * (isEmphasized ? 1.9 : 1.1);
  const coreShiftY = Math.cos(phase * 1.34) * (isEmphasized ? 1.5 : 0.85);
  const coreScale = Math.max(0.84, Math.min(1.24, 1 + (pulseValue * 0.08) + (isEmphasized ? 0.03 : 0)));
  const coreRot = (pulseValue * 5.6) + (Math.sin(phase * 0.72) * 2.2);
  const hubEnergy = Math.max(0, Math.min(1, Math.abs(pulseValue) * 0.75 + (isEmphasized ? 0.22 : 0.08)));

  const scaleStepCap = engineTune.scaleCap * dt;
  const coreStepCap = engineTune.pullCap * 0.55 * dt;
  const coreRotCap = Math.max(0.6, engineTune.pullCap * 0.9 * dt);

  setSteppedVar(hub, "--hub-scale", hubScale, "", scaleStepCap, 1);
  setSteppedVar(hub, "--core-shift-x", coreShiftX, "px", coreStepCap);
  setSteppedVar(hub, "--core-shift-y", coreShiftY, "px", coreStepCap);
  setSteppedVar(hub, "--core-scale", coreScale, "", scaleStepCap, 1);
  setSteppedVar(hub, "--core-rot", coreRot, "deg", coreRotCap);
  setSteppedVar(hub, "--hub-energy", hubEnergy, "", Math.max(0.02, scaleStepCap), 0);
}

function applyNodeReaction(node, pulseValue, phase, emphasis = 1) {
  if (!node) return;

  const driftX = Math.sin(phase * 1.26) * (1.1 + Math.abs(pulseValue) * 2.2) * emphasis;
  const driftY = Math.cos(phase * 1.08) * (0.9 + Math.abs(pulseValue) * 1.9) * emphasis;
  const nodeScale = Math.max(0.78, Math.min(1.42, 1 + Math.abs(pulseValue) * 0.28 + Math.sin(phase * 1.48) * 0.08));
  const glow = 14 + (Math.abs(pulseValue) * 18);

  node.style.setProperty("--node-pull-x", `${driftX.toFixed(2)}px`);
  node.style.setProperty("--node-pull-y", `${driftY.toFixed(2)}px`);
  node.style.setProperty("--node-scale", nodeScale.toFixed(4));
  node.style.boxShadow = `0 0 ${glow.toFixed(1)}px rgba(255, 214, 130, 0.72)`;
}

function applyStrandFluctuation(strand, phase, intensity) {
  if (!strand) return;

  const x = Math.sin(phase * 0.9) * intensity;
  const y = Math.cos(phase * 1.1) * (intensity * 0.55);
  const rot = Math.sin(phase * 0.7) * (intensity * 0.26);
  const energy = Math.max(0, Math.min(1, intensity / (REDUCED_MOTION ? 2.2 : 5.2)));

  strand.style.setProperty("--strand-shift-x", `${x.toFixed(2)}px`);
  strand.style.setProperty("--strand-shift-y", `${y.toFixed(2)}px`);
  strand.style.setProperty("--strand-rot", `${rot.toFixed(2)}deg`);
  strand.style.setProperty("--strand-energy", energy.toFixed(4));
}

function matrixPulse(t) {
  const inner = Math.sin((t * engineTune.innerSpeed) + MATRIX_OSC.inner.phase) * engineTune.innerVolume;
  const outer = Math.sin((t * engineTune.outerSpeed) + MATRIX_OSC.outer.phase) * engineTune.outerVolume;
  return {
    inner,
    outer,
    blend: inner + outer,
  };
}

function tickDiamondPull(timestamp) {
  if (!diamondField) return;

  const hoverPath = page.dataset.hover || null;
  const committedPath = page.dataset.path || null;
  const emphasizedPath = hoverPath || committedPath;

  const fieldRect = diamondField.getBoundingClientRect();
  const fieldCenter = centerFromRect(fieldRect);
  const ne = diamondCornerNE ? centerFromRect(diamondCornerNE.getBoundingClientRect()) : { x: fieldRect.right - fieldRect.width * 0.24, y: fieldRect.top + fieldRect.height * 0.16 };
  const nw = diamondCornerNW ? centerFromRect(diamondCornerNW.getBoundingClientRect()) : { x: fieldRect.left + fieldRect.width * 0.24, y: fieldRect.top + fieldRect.height * 0.16 };
  const sw = diamondCornerSW ? centerFromRect(diamondCornerSW.getBoundingClientRect()) : { x: fieldRect.left + fieldRect.width * 0.24, y: fieldRect.bottom - fieldRect.height * 0.16 };

  const t = timestamp * 0.001;
  const rawPulse = matrixPulse(t);
  const dt = Math.min(0.08, Math.max(0.008, (timestamp - (lastDiamondTick || timestamp)) / 1000));
  lastDiamondTick = timestamp;
  const smoothingBase = REDUCED_MOTION ? Math.min(0.22, dt * 3.6) : Math.min(0.28, dt * 7.2);
  const smoothing = Math.min(smoothingBase, engineTune.damping);

  smoothedPulse.inner = dampToward(smoothedPulse.inner, rawPulse.inner, smoothing);
  smoothedPulse.outer = dampToward(smoothedPulse.outer, rawPulse.outer, smoothing);
  smoothedPulse.blend = smoothedPulse.inner + smoothedPulse.outer;
  const pulse = smoothedPulse;
  const base = REDUCED_MOTION ? 1.2 : 3.2;
  const hot = REDUCED_MOTION ? 2.1 : 6.8;
  const strandBase = REDUCED_MOTION ? 0.9 : 2.1;
  const strandHot = REDUCED_MOTION ? 1.4 : 4.1;
  const overlayDrift = REDUCED_MOTION ? 0.45 : 1.05;
  const hubDrift = REDUCED_MOTION ? 0.35 : 0.9;

  const wakeStrength = (emphasizedPath === "wake" ? hot : base) + (pulse.blend * overlayDrift);
  const foldStrength = (emphasizedPath === "fold" ? hot : base) + (pulse.inner * overlayDrift);
  const spireStrength = (emphasizedPath === "spire" ? hot : base) + (pulse.outer * overlayDrift);
  const wakeStrand = (emphasizedPath === "wake" ? strandHot : strandBase) + Math.abs(pulse.inner) * 0.7;
  const foldStrand = (emphasizedPath === "fold" ? strandHot : strandBase) + Math.abs(pulse.blend) * 0.7;
  const spireStrand = (emphasizedPath === "spire" ? strandHot : strandBase) + Math.abs(pulse.outer) * 0.7;

  const fieldRotation = Math.sin(t * 0.42) * (REDUCED_MOTION ? 0.6 : 2.4)
    + (pulse.inner * (REDUCED_MOTION ? 0.35 : 1.2))
    + (pulse.outer * (REDUCED_MOTION ? 0.28 : 0.8));
  diamondField.style.setProperty("--diamond-rot", `${fieldRotation.toFixed(2)}deg`);
  diamondField.style.setProperty("--diamond-rot-inner", `${(fieldRotation + pulse.inner * 1.6).toFixed(2)}deg`);
  diamondField.style.setProperty("--diamond-rot-outer", `${(fieldRotation - pulse.outer * 2.1).toFixed(2)}deg`);
  diamondField.style.setProperty("--matrix-wave-a", pulse.inner.toFixed(4));
  diamondField.style.setProperty("--matrix-wave-b", pulse.outer.toFixed(4));

  // Overlay hubs are attracted by corresponding diamond corners.
  applyOverlayPull(overlayWake, {
    x: nw.x * 0.74 + fieldCenter.x * 0.26,
    y: nw.y * 0.74 + fieldCenter.y * 0.26,
  }, wakeStrength, t + 0.3, dt);

  applyOverlayPull(overlayFold, {
    x: ne.x * 0.74 + fieldCenter.x * 0.26,
    y: ne.y * 0.74 + fieldCenter.y * 0.26,
  }, foldStrength, t + 1.1, dt);

  applyOverlayPull(overlaySpire, {
    x: sw.x * 0.76 + fieldCenter.x * 0.24,
    y: sw.y * 0.76 + fieldCenter.y * 0.24,
  }, spireStrength, t + 1.9, dt);

  const hubBase = REDUCED_MOTION ? 0.8 : 2.3;
  const hubHot = REDUCED_MOTION ? 1.4 : 4.8;
  const wakeHubStrength = (emphasizedPath === "wake" ? hubHot : hubBase) + (pulse.blend * hubDrift);
  const foldHubStrength = (emphasizedPath === "fold" ? hubHot : hubBase) + (pulse.inner * hubDrift);
  const spireHubStrength = (emphasizedPath === "spire" ? hubHot : hubBase) + (pulse.outer * hubDrift);

  applyHubPull(hubA, {
    x: nw.x * 0.72 + fieldCenter.x * 0.28,
    y: nw.y * 0.72 + fieldCenter.y * 0.28,
  }, wakeHubStrength, t + 0.45, dt);

  applyHubPull(hubB, {
    x: ne.x * 0.72 + fieldCenter.x * 0.28,
    y: ne.y * 0.72 + fieldCenter.y * 0.28,
  }, foldHubStrength, t + 1.25, dt);

  applyHubPull(hubC, {
    x: sw.x * 0.74 + fieldCenter.x * 0.26,
    y: sw.y * 0.74 + fieldCenter.y * 0.26,
  }, spireHubStrength, t + 2.0, dt);

  applyHubBreath(hubA, pulse.blend, t + 0.55, emphasizedPath === "wake", dt);
  applyHubBreath(hubB, pulse.inner, t + 1.3, emphasizedPath === "fold", dt);
  applyHubBreath(hubC, pulse.outer, t + 2.05, emphasizedPath === "spire", dt);

  applyNodeReaction(diamondCornerNW, pulse.inner, t + 0.35, emphasizedPath === "wake" ? 1.18 : 1);
  applyNodeReaction(diamondCornerNE, pulse.blend, t + 1.1, emphasizedPath === "fold" ? 1.18 : 1);
  applyNodeReaction(diamondCornerSW, pulse.outer, t + 1.85, emphasizedPath === "spire" ? 1.18 : 1);
  applyNodeReaction(diamondCornerSE, pulse.blend * 0.82, t + 2.3, 0.88);

  applyStrandFluctuation(strandWake, t + 0.2, wakeStrand);
  applyStrandFluctuation(strandFold, t + 1.0, foldStrand);
  applyStrandFluctuation(strandSpire, t + 1.8, spireStrand);

  if (telemetryMatrix) {
    telemetryMatrix.textContent = page.dataset.hubState || "idle";
  }
  if (telemetryWaveA) {
    telemetryWaveA.textContent = pulse.inner.toFixed(4);
  }
  if (telemetryWaveB) {
    telemetryWaveB.textContent = pulse.outer.toFixed(4);
  }
  if (telemetryPath) {
    telemetryPath.textContent = emphasizedPath || "none";
  }
  if (telemetryEnergy) {
    const eA = Number(hubA?.style.getPropertyValue("--hub-energy") || 0);
    const eB = Number(hubB?.style.getPropertyValue("--hub-energy") || 0);
    const eC = Number(hubC?.style.getPropertyValue("--hub-energy") || 0);
    telemetryEnergy.textContent = Math.max(eA, eB, eC).toFixed(4);
  }

  senseVoidBoundary(pulse);

  diamondPullAnimationHandle = window.requestAnimationFrame(tickDiamondPull);
}

function startDiamondPullField() {
  if (!diamondField) return;
  if (diamondPullAnimationHandle) {
    window.cancelAnimationFrame(diamondPullAnimationHandle);
  }
  page.dataset.diamonds = "on";
  tickDiamondPull(performance.now());
}

function stopDiamondPullField() {
  if (diamondPullAnimationHandle) {
    window.cancelAnimationFrame(diamondPullAnimationHandle);
    diamondPullAnimationHandle = null;
  }
}

function scheduleDiamondRetire() {
  if (!diamondField) return;

  if (diamondFadeTimer) {
    window.clearTimeout(diamondFadeTimer);
    diamondFadeTimer = null;
  }
  if (diamondRemoveTimer) {
    window.clearTimeout(diamondRemoveTimer);
    diamondRemoveTimer = null;
  }

  diamondFadeTimer = window.setTimeout(() => {
    page.dataset.diamonds = "fading";
  }, REDUCED_MOTION ? 1 : Math.round(engineTune.retireStart));

  diamondRemoveTimer = window.setTimeout(() => {
    page.dataset.diamonds = "off";
    stopDiamondPullField();
  }, REDUCED_MOTION ? 1 : Math.round(engineTune.retireEnd));
}

function createSpaceParticle(type) {
  const el = document.createElement("span");
  el.className = `space-particle ${type === "glyph" ? "space-glyph" : "space-orb"}`;

  const depth = randomBetween(0.05, 1);
  const baseSize = type === "glyph" ? randomBetween(12, 24) : randomBetween(8, 22);
  const size = baseSize * (0.65 + depth * 0.85);
  const x = randomBetween(0, window.innerWidth);
  const y = randomBetween(0, window.innerHeight);
  const vx = randomBetween(-22, 22) * SPACE_CONFIG.speedFactor;
  const vy = randomBetween(-18, 18) * SPACE_CONFIG.speedFactor;
  const vz = randomBetween(-0.11, 0.11) * SPACE_CONFIG.speedFactor;

  if (type === "glyph") {
    el.textContent = randomGlyph();
    el.style.fontSize = `${size}px`;
  } else {
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
  }

  const particle = {
    type,
    el,
    x,
    y,
    z: depth,
    vx,
    vy,
    vz,
    size,
    collisionCooldown: 0,
  };

  spaceLayer.appendChild(el);
  return particle;
}

function flashCollision(particle) {
  particle.el.classList.add("space-collision");
  window.setTimeout(() => {
    particle.el.classList.remove("space-collision");
  }, 140);
}

function applySpaceTransform(particle) {
  const depthScale = 0.62 + particle.z * 0.95;
  const alpha = 0.25 + particle.z * 0.7;
  particle.el.style.opacity = `${alpha}`;
  particle.el.style.transform = `translate3d(${particle.x}px, ${particle.y}px, ${Math.round(particle.z * 420)}px) scale(${depthScale})`;
}

function resolveSpaceCollisions() {
  for (let i = 0; i < spaceParticles.length; i += 1) {
    const a = spaceParticles[i];
    for (let j = i + 1; j < spaceParticles.length; j += 1) {
      const b = spaceParticles[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = (a.size + b.size) * 0.42;
      if (distSq > minDist * minDist) continue;

      const dist = Math.sqrt(distSq) || 0.0001;
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (minDist - dist) * 0.5;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const avx = a.vx;
      const avy = a.vy;
      a.vx = b.vx * randomBetween(0.84, 1.08);
      a.vy = b.vy * randomBetween(0.84, 1.08);
      b.vx = avx * randomBetween(0.84, 1.08);
      b.vy = avy * randomBetween(0.84, 1.08);

      a.vx += randomBetween(-8, 8) * SPACE_CONFIG.speedFactor;
      a.vy += randomBetween(-7, 7) * SPACE_CONFIG.speedFactor;
      b.vx += randomBetween(-8, 8) * SPACE_CONFIG.speedFactor;
      b.vy += randomBetween(-7, 7) * SPACE_CONFIG.speedFactor;

      if (a.collisionCooldown <= 0) {
        flashCollision(a);
        a.collisionCooldown = 0.18;
      }
      if (b.collisionCooldown <= 0) {
        flashCollision(b);
        b.collisionCooldown = 0.18;
      }
    }
  }
}

function tickSpaceField(timestamp) {
  if (!spaceLayer) return;

  const dt = Math.min(0.033, (timestamp - lastSpaceTick) / 1000 || 0.016);
  lastSpaceTick = timestamp;

  const width = window.innerWidth;
  const height = window.innerHeight;

  for (const particle of spaceParticles) {
    particle.x += particle.vx * dt * (0.75 + particle.z * 0.8);
    particle.y += particle.vy * dt * (0.75 + particle.z * 0.8);
    particle.z += particle.vz * dt;
    particle.collisionCooldown -= dt;

    if (particle.z < 0.05 || particle.z > 1) {
      particle.vz *= -1;
      particle.z = Math.min(1, Math.max(0.05, particle.z));
    }

    const pad = 12;
    if (particle.x < -pad || particle.x > width + pad) {
      particle.vx *= -1;
      particle.x = Math.min(width + pad, Math.max(-pad, particle.x));
    }
    if (particle.y < -pad || particle.y > height + pad) {
      particle.vy *= -1;
      particle.y = Math.min(height + pad, Math.max(-pad, particle.y));
    }

    applySpaceTransform(particle);
  }

  resolveSpaceCollisions();

  if (!REDUCED_MOTION && Math.random() < 0.015 && spaceParticles.length > 2) {
    const randomIndex = Math.floor(Math.random() * spaceParticles.length);
    const p = spaceParticles[randomIndex];
    p.vx += randomBetween(-14, 14);
    p.vy += randomBetween(-11, 11);
    flashCollision(p);
  }

  spaceAnimationHandle = window.requestAnimationFrame(tickSpaceField);
}

function startSpaceField() {
  if (!spaceLayer) return;

  spaceLayer.innerHTML = "";
  spaceParticles = [];

  for (let i = 0; i < SPACE_CONFIG.orbCount; i += 1) {
    spaceParticles.push(createSpaceParticle("orb"));
  }
  for (let i = 0; i < SPACE_CONFIG.glyphCount; i += 1) {
    spaceParticles.push(createSpaceParticle("glyph"));
  }

  if (spaceAnimationHandle) {
    window.cancelAnimationFrame(spaceAnimationHandle);
  }
  lastSpaceTick = performance.now();
  spaceAnimationHandle = window.requestAnimationFrame(tickSpaceField);
}

function moveSeedLogoRandomly() {
  if (!seedLogo) return;

  const logoSize = seedLogo.getBoundingClientRect().width || 54;
  const padding = 14;
  const maxX = Math.max(padding, window.innerWidth - logoSize - padding);
  const maxY = Math.max(padding, window.innerHeight - logoSize - padding);
  const targetX = randomBetween(padding, maxX);
  const targetY = randomBetween(padding, maxY);
  const scale = randomBetween(0.78, 1.08);
  const duration = REDUCED_MOTION ? randomBetween(4200, 6200) : randomBetween(2600, 4200);
  const fadeOutStart = duration * 0.52;
  const peakOpacity = REDUCED_MOTION ? 0.48 : 0.9;
  const enterScale = REDUCED_MOTION ? 0.95 : 0.84;
  const exitScale = REDUCED_MOTION ? 1.02 : 1.12;

  seedLogo.style.left = `${targetX}px`;
  seedLogo.style.top = `${targetY}px`;
  seedLogo.style.transition = "none";
  seedLogo.style.opacity = "0";
  seedLogo.style.transform = `translate(-50%, -50%) scale(${enterScale})`;

  window.requestAnimationFrame(() => {
    seedLogo.style.transition = `opacity ${Math.round(duration * 0.45)}ms cubic-bezier(0.22,1,0.36,1), transform ${Math.round(duration * 0.55)}ms cubic-bezier(0.22,1,0.36,1)`;
    seedLogo.style.opacity = `${peakOpacity}`;
    seedLogo.style.transform = `translate(-50%, -50%) scale(${scale})`;
  });

  window.setTimeout(() => {
    seedLogo.style.opacity = "0";
    seedLogo.style.transform = `translate(-50%, -50%) scale(${exitScale})`;
  }, fadeOutStart);

  const nextDelay = duration + randomBetween(REDUCED_MOTION ? 1200 : 700, REDUCED_MOTION ? 2600 : 1800);
  seedTimer = window.setTimeout(moveSeedLogoRandomly, nextDelay);
}

function startSeedLoop() {
  if (!seedLogo) return;
  if (seedTimer) {
    window.clearTimeout(seedTimer);
  }
  seedTimer = window.setTimeout(moveSeedLogoRandomly, 320);
}

function setPath(path) {
  page.dataset.path = path;
}

function setState(state) {
  page.dataset.hubState = state;
}

function centerOf(el) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function applyBackground(path) {
  const color = PATH_META[path]?.background ?? "#000000";
  page.style.setProperty("--bg-primary", color);
}

function setSpin(path) {
  const activeHub = path === "wake" ? hubA : path === "fold" ? hubB : hubC;
  const dir = PATH_META[path]?.spinDirection ?? 1;
  const rings = activeHub.querySelectorAll(".hub-ring");
  const durations = [2400, 1800, 1200];
  rings.forEach((ring, idx) => {
    ring.style.animation = "none";
    ring.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${dir * 360}deg)` },
      ],
      {
        duration: REDUCED_MOTION ? 1 : durations[idx],
        iterations: Infinity,
        easing: "linear",
      }
    );
  });
}

function pulseHub(path) {
  const target = path === "wake" ? hubA : path === "fold" ? hubB : hubC;
  const inward = PATH_META[path]?.inwardPulse ?? false;
  const toScale = inward ? 0.88 : 1.15;
  target.animate(
    [
      { transform: "scale(1)" },
      { transform: `scale(${toScale})` },
      { transform: "scale(1)" },
    ],
    {
      duration: REDUCED_MOTION ? 1 : 160,
      easing: inward ? "ease-in" : "ease-out",
    }
  );
}

function runOverlay(path) {
  const color = path === "wake" ? "0,0,0" : "255,255,255";
  overlay.animate(
    [
      { opacity: 0, background: `rgba(${color},0)` },
      { opacity: 1, background: `rgba(${color},1)` },
    ],
    {
      duration: REDUCED_MOTION ? 1 : TIMING.FADE_DURATION,
      fill: "forwards",
      easing: "ease-in",
    }
  );

  window.setTimeout(() => {
    overlay.animate(
      [
        { opacity: 1, background: `rgba(${color},1)` },
        { opacity: 0, background: `rgba(${color},0)` },
      ],
      {
        duration: REDUCED_MOTION ? 1 : 500,
        fill: "forwards",
        easing: "ease-out",
      }
    );
  }, REDUCED_MOTION ? 1 : TIMING.OVERLAY_LIFT);
}

function pickGlyphs(count) {
  const shuffled = [...glyphSet].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function hubForPath(path) {
  if (path === "wake") return hubA;
  if (path === "fold") return hubB;
  return hubC;
}

async function detectLowFps() {
  if (REDUCED_MOTION) return true;
  let slowFrames = 0;
  let last = performance.now();
  for (let i = 0; i < 3; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const now = performance.now();
    const delta = now - last;
    if (delta > 33.3) slowFrames += 1;
    last = now;
  }
  return slowFrames >= 2;
}

async function spawnGlyphs(path) {
  const lowFps = await detectLowFps();
  const glyphCount = lowFps ? 6 : 12;
  const chars = pickGlyphs(glyphCount);
  const hub = hubForPath(path);
  const center = centerOf(hub);
  const radius = 120;
  const hubRect = hub.getBoundingClientRect();
  const startAroundOrbit = path === "fold";

  chars.forEach((char, idx) => {
    const angle = (Math.PI * 2 * idx) / glyphCount;
    const startX = startAroundOrbit ? center.x + Math.cos(angle) * radius : center.x;
    const startY = startAroundOrbit ? center.y + Math.sin(angle) * radius : center.y;
    const endX = startAroundOrbit ? center.x : center.x + Math.cos(angle) * radius;
    const endY = startAroundOrbit ? center.y : center.y + Math.sin(angle) * radius;

    const glyph = document.createElement("span");
    glyph.className = "spawn-glyph";
    glyph.textContent = char;
    glyph.style.left = `${startX}px`;
    glyph.style.top = `${startY}px`;
    glyphLayer.appendChild(glyph);

    const rotate = path === "wake" ? 360 : path === "fold" ? -360 : 240;
    const easing =
      path === "wake"
        ? "cubic-bezier(0.16,1,0.3,1)"
        : path === "fold"
          ? "cubic-bezier(0.7,0,0.84,0)"
          : "cubic-bezier(0.33,1,0.68,1)";
    glyph.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 0.7 },
        {
          transform: `translate(${endX - startX - 50}px, ${endY - startY - 50}px) rotate(${rotate}deg)`,
          opacity: path === "wake" ? 0.7 : 0,
        },
      ],
      {
        duration: REDUCED_MOTION ? 1 : 900,
        easing,
        fill: "forwards",
      }
    );

    if (path === "wake" && !REDUCED_MOTION) {
      window.setTimeout(() => {
        const relX = endX - hubRect.left;
        const relY = endY - hubRect.top;
        glyph.style.left = `${relX}px`;
        glyph.style.top = `${relY}px`;
        glyph.style.position = "absolute";
        hub.appendChild(glyph);
        glyph.style.transform = "translate(-50%, -50%)";
        glyph.animate(
          [
            { transform: "translate(-50%, -50%) rotate(0deg)" },
            { transform: "translate(-50%, -50%) rotate(-360deg)" },
          ],
          {
            duration: 45000,
            iterations: Infinity,
            easing: "linear",
          }
        );
      }, TIMING.LABEL_APPEAR);
    } else {
      window.setTimeout(() => glyph.remove(), TIMING.OVERLAY_LIFT + 200);
    }
  });
}

function showLabelsAndDimming(path) {
  labelA.style.opacity = "0";
  labelB.style.opacity = "0";
  labelC.style.opacity = "0";

  if (path === "wake") labelA.style.opacity = "1";
  if (path === "fold") labelB.style.opacity = "1";
  if (path === "spire") labelC.style.opacity = "1";
}

function setContinue(path) {
  if (!continueLink) return;
  continueLink.href = PATH_META[path]?.continueHref ?? "discover.html";
  continueLink.dataset.visible = "true";
  continueLink.setAttribute("aria-hidden", "false");
}

function announce(path) {
  if (!live) return;
  const pathName = PATH_META[path]?.name ?? "Unknown";
  live.textContent = `Channel locked: ${pathName}`;
}

function setTitle(path) {
  const pathName = PATH_META[path]?.name ?? "Hub";
  document.title = `Threshold Engine Mechanics - ${pathName}`;
}

function renderSettled(path) {
  hubActivated = true;
  setPath(path);
  setState("committed");
  page.dataset.diamonds = "off";
  applyBackground(path);
  setSpin(path);
  showLabelsAndDimming(path);
  setContinue(path);
  setTitle(path);
}

async function activate(path) {
  const now = performance.now();
  if (now < debounceUntil) return;
  debounceUntil = now + TIMING.DEBOUNCE_LOCK;

  // Race-condition guard: must be synchronous first line inside handler body.
  if (hubActivated) return;
  hubActivated = true;

  setState("locked");
  page.style.pointerEvents = "none";
  pulseHub(path);
  runOverlay(path);

  window.setTimeout(() => {
    spawnGlyphs(path);
  }, REDUCED_MOTION ? 1 : TIMING.GLYPH_SPAWN_START);

  window.setTimeout(() => {
    applyBackground(path);
  }, REDUCED_MOTION ? 1 : TIMING.COLOR_INVERT_START);

  window.setTimeout(() => {
    setSpin(path);
  }, REDUCED_MOTION ? 1 : TIMING.SPIN_START);

  window.setTimeout(() => {
    setPath(path);
    showLabelsAndDimming(path);
    sessionStorage.setItem(PATH_KEY, path);
    setTitle(path);
  }, REDUCED_MOTION ? 1 : TIMING.LABEL_APPEAR);

  await wait(REDUCED_MOTION ? 1 : TIMING.FINAL_STATE);
  setState("committed");
  page.style.pointerEvents = "auto";
  announce(path);
  scheduleDiamondRetire();

  window.setTimeout(() => {
    setContinue(path);
  }, REDUCED_MOTION ? 1 : TIMING.CONTINUE_APPEAR - TIMING.FINAL_STATE);
}

function setHoverState(path) {
  if (hubActivated) return;
  page.dataset.hubState = "matrix";
  page.dataset.hover = path;
}

function clearHoverState() {
  if (hubActivated) return;
  delete page.dataset.hover;
  page.dataset.hubState = "idle";
}

function triggerChoiceMatrix(path) {
  if (!PATH_META[path] || hubActivated) return;
  page.dataset.hubState = "matrix";
  page.dataset.hover = path;
}

function wireHub(hub, path) {
  hub.addEventListener("pointerenter", () => triggerChoiceMatrix(path));
  hub.addEventListener("pointerleave", clearHoverState);
  hub.addEventListener("focus", () => triggerChoiceMatrix(path));
  hub.addEventListener("blur", clearHoverState);
  hub.addEventListener("pointerdown", () => {
    triggerChoiceMatrix(path);
    activate(path);
  });
  hub.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerChoiceMatrix(path);
      activate(path);
    }
    if (event.key === "Escape") {
      clearHoverState();
    }
  });
}

function wireLogoTriggers() {
  logoTriggers.forEach((logo) => {
    const path = logo.dataset.hubTarget;
    if (!PATH_META[path]) return;

    logo.addEventListener("pointerenter", () => triggerChoiceMatrix(path));
    logo.addEventListener("pointerleave", clearHoverState);
    logo.addEventListener("focus", () => triggerChoiceMatrix(path));
    logo.addEventListener("blur", clearHoverState);
    logo.addEventListener("click", () => {
      triggerChoiceMatrix(path);
      activate(path);
    });
  });
}

function wireStrandChoices() {
  strandChoices.forEach((strand) => {
    const path = strand.dataset.hubTarget;
    if (!PATH_META[path]) return;

    strand.addEventListener("pointerenter", () => triggerChoiceMatrix(path));
    strand.addEventListener("pointerleave", clearHoverState);
    strand.addEventListener("focus", () => triggerChoiceMatrix(path));
    strand.addEventListener("blur", clearHoverState);
    strand.addEventListener("pointerdown", () => {
      triggerChoiceMatrix(path);
      activate(path);
    });
    strand.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerChoiceMatrix(path);
        activate(path);
      }
      if (event.key === "Escape") {
        clearHoverState();
      }
    });
  });
}

function wireHiddenReset() {
  // Hidden developer escape hatch. Not exposed in player-facing UI.
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.altKey && event.key === "Backspace") {
      sessionStorage.removeItem(PATH_KEY);
      window.location.reload();
    }
  });
}

function init() {
  page.dataset.diamonds = "on";
  wireCalibrationPanel();
  applyTuneFromControls();
  const storedPath = sessionStorage.getItem(PATH_KEY);
  if (storedPath === "wake" || storedPath === "fold" || storedPath === "spire") {
    renderSettled(storedPath);
  }

  wireHub(hubA, "wake");
  wireHub(hubB, "fold");
  wireHub(hubC, "spire");
  wireLogoTriggers();
  wireStrandChoices();
  wireHiddenReset();
  startSeedLoop();
  startSpaceField();
  if (!hubActivated) {
    startDiamondPullField();
  } else {
    stopDiamondPullField();
  }
}

init();
