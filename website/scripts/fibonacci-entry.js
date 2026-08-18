import { buildFibonacciUrl, resolveFibonacciRoute } from "./fibonacci-routing.js";
import {
  advanceHeartbeatClock,
  createHeartbeatClock,
  heartbeatEnvelope
} from "./engine-heartbeat.js";
import {
  advanceHubActivation,
  createHubActivationState
} from "./hub-activation.js";
import {
  buildPrimeAtomSignalChain,
  createChamberContext,
  createDirectionVector
} from "./prime-atom-signals.js";

const routeLinks = document.querySelectorAll("[data-fibonacci-spoke][data-fibonacci-path]");
const seedArchive = document.querySelector("[data-hub-seed-archive]");
const seedList = document.querySelector("[data-hub-seed-list]");
const hubWheel = document.querySelector("[data-hub-wheel]");
const hubReceptor = document.querySelector("[data-hub-receptor]");
const hubNodeField = document.querySelector("[data-hub-node-field]");
const engineCore = document.querySelector("[data-engine-core]");
const voidCanvas = document.querySelector("[data-void-field]");
const hubReactor = document.querySelector("[data-hub-reactor]");
const primeLogo = document.querySelector("[data-prime-logo]");
const primeDoor = document.querySelector("[data-prime-door]");
const revealBox = document.querySelector("[data-reveal-box]");
const hubEntryReveal = document.querySelector("[data-hub-entry-reveal]");
const hubEntryLink = document.querySelector("[data-hub-entry-link]");
const categoryLinks = Array.from(document.querySelectorAll(".entry-actions a"));

const descentRings = { 13: 8, 8: 5, 5: 3, 3: 1 };
const entryRing = 13;

const voidSignatures = {
  ethos: { color: [214, 168, 75], motion: "vertical" },
  glyphs: { color: [75, 117, 255], motion: "horizontal" },
  mythology: { color: [187, 76, 43], motion: "spiral" },
  dialogues: { color: [107, 224, 235], motion: "ripple" },
  contact: { color: [255, 239, 199], motion: "radiating" }
};

const revealDirections = {
  left: { color: [31, 59, 255], spin: 1, distortion: "horizontal", glow: "left" },
  right: { color: [214, 168, 75], spin: -1, distortion: "horizontal", glow: "right" },
  top: { color: [201, 247, 255], spin: 0, tilt: 1, distortion: "vertical", glow: "top" },
  bottom: { color: [220, 94, 48], spin: 0, tilt: -1, distortion: "vertical", glow: "bottom" }
};

const revealThemes = {
  "house and garden": { id: "root-bloom", color: [214, 168, 75], duration: 900 },
  ethos: { id: "glyphfall-alignment", color: [244, 207, 132], duration: 820 },
  "learning wheel": { id: "cycle-burst", color: [64, 112, 255], duration: 780 },
  discover: { id: "drift-scatter", color: [155, 91, 214], duration: 860 },
  invitation: { id: "threshold-opening", color: [91, 222, 194], duration: 900 },
  mythology: { id: "firefall-origin", color: [205, 72, 38], duration: 980 },
  glyphs: { id: "symbol-cascade", color: [83, 137, 255], duration: 820 },
  dialogues: { id: "signal-oscillation", color: [99, 225, 235], duration: 760 },
  contact: { id: "transmission-burst", color: [255, 242, 210], duration: 700 },
  "enter engine": { id: "ring-descent", color: [139, 228, 213], duration: 920 }
};

const revealTiming = { directional: 400, transition: 720 };

function title(value) {
  return String(value || "unknown").replace(/-/g, " ");
}

function loadReturnedSeeds() {
  try {
    const seeds = JSON.parse(sessionStorage.getItem("threshold:hub-seeds") || "[]");
    return Array.isArray(seeds) ? seeds.slice(-6).reverse() : [];
  } catch {
    return [];
  }
}

function renderReturnedSeeds() {
  if (!seedArchive || !seedList) {
    return;
  }
  const seeds = loadReturnedSeeds();
  seedList.replaceChildren();
  seeds.forEach((seed) => {
    const state = seed && seed.state || {};
    const item = document.createElement("li");
    const fib = document.createElement("span");
    const version = document.createElement("span");
    const memory = document.createElement("span");
    fib.className = "entry-seed-fib";
    version.className = "entry-seed-version";
    memory.className = "entry-seed-memory";
    fib.textContent = "Fib " + String(seed.fromFib || "?");
    version.textContent = title(state.version);
    memory.textContent = "Returned with " + title(state.choice)
      + " · " + String(Number(state.stays || 0)) + " stays";
    item.append(fib, version, memory);
    seedList.appendChild(item);
  });
  seedArchive.hidden = seeds.length === 0;
}

renderReturnedSeeds();

function initializeHubReactor() {
  if (!hubWheel || !hubReceptor || !hubNodeField || !engineCore) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const heartbeatClock = createHeartbeatClock({ startedAt: performance.now() });
  let hubActivation = createHubActivationState(performance.now());
  const nodeCount = 8;
  const nodes = Array.from({ length: nodeCount }, (_, index) => {
    const node = document.createElement("span");
    node.className = "entry-orbit-node";
    node.dataset.nodeIndex = String(index);
    hubNodeField.appendChild(node);
    return node;
  });
  const state = {
    pointerX: -1000,
    pointerY: -1000,
    previousPointerX: -1000,
    previousPointerY: -1000,
    pointerElapsedMs: 16,
    pointerMovedAt: performance.now(),
    rotation: 0,
    zone: "idle",
    previousZone: "idle",
    hoveredLink: null,
    hoverAngle: null,
    retreatStartedAt: 0,
    retreatFrom: 0,
    retreatTo: 0,
    scatterStartedAt: 0,
    selectedLink: null,
    contactStartedAt: 0,
    approachDirection: null,
    gesture: null,
    doorUnlocked: false,
    lastSparkAt: 0,
    lastSignalChain: null,
    frameId: 0,
    lastFrameAt: performance.now()
  };
  const engineState = {
    pressure: 0.08,
    signalScale: 1,
    timingScale: 1,
    heartbeatEvent: null,
    reveal: null,
    transitionStartedAt: 0
  };
  const voidContext = voidCanvas?.getContext("2d", { alpha: true });
  const voidState = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    signature: null,
    waves: [],
    particles: [],
    frameParticles: [],
    scrollY: window.scrollY
  };

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function easeInOut(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function wheelMetrics() {
    const rect = hubWheel.getBoundingClientRect();
    return {
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      radius: rect.width / 2
    };
  }

  function approachDirection(metrics = wheelMetrics()) {
    const deltaX = state.pointerX - metrics.centerX;
    const deltaY = state.pointerY - metrics.centerY;
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
      return deltaX < 0 ? "left" : "right";
    }
    return deltaY < 0 ? "top" : "bottom";
  }

  function revealStage(now) {
    if (!engineState.reveal) return "idle";
    const elapsed = now - engineState.reveal.startedAt;
    if (elapsed < revealTiming.directional) return "directional";
    if (elapsed < revealTiming.directional + engineState.reveal.theme.duration) return "chamber";
    return "transition";
  }

  function resizeVoid() {
    if (!voidCanvas || !voidContext) {
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    voidState.width = window.innerWidth;
    voidState.height = window.innerHeight;
    voidState.pixelRatio = pixelRatio;
    voidCanvas.width = Math.round(voidState.width * pixelRatio);
    voidCanvas.height = Math.round(voidState.height * pixelRatio);
    voidCanvas.style.width = voidState.width + "px";
    voidCanvas.style.height = voidState.height + "px";
    voidContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const particleCount = voidState.width < 600 ? 34 : 62;
    while (voidState.particles.length < particleCount) {
      const index = voidState.particles.length;
      voidState.particles.push({
        x: Math.random() * voidState.width,
        y: Math.random() * voidState.height,
        previousX: 0,
        previousY: 0,
        size: 0.65 + Math.random() * 1.35,
        drift: 0.14 + Math.random() * 0.32,
        phase: index * 1.71 + Math.random() * Math.PI,
        gold: index % 9 === 0
      });
    }
    voidState.particles.length = particleCount;
    const frameParticleCount = voidState.width < 600 ? 12 : 20;
    while (voidState.frameParticles.length < frameParticleCount) {
      const index = voidState.frameParticles.length;
      voidState.frameParticles.push({
        progress: index / frameParticleCount,
        speed: 0.000012 + Math.random() * 0.00001,
        size: 0.55 + Math.random() * 0.85,
        gold: index % 5 === 0
      });
    }
    voidState.frameParticles.length = frameParticleCount;
    if (reducedMotion.matches) {
      drawVoid(performance.now(), 0, wheelMetrics(), true);
    }
  }

  function addPressureWave(type, strength = 1, signature = voidState.signature) {
    if (!voidContext || reducedMotion.matches) {
      return;
    }
    voidState.waves.push({
      bornAt: performance.now(),
      type,
      strength,
      signature
    });
    voidState.waves = voidState.waves.slice(-9);
  }

  function emitEngineEvent(type, detail = {}) {
    window.dispatchEvent(new CustomEvent("threshold:engine-event", {
      detail: { type, pressure: engineState.pressure, ...detail }
    }));
  }

  function heartbeatSnapshot(now) {
    const event = engineState.heartbeatEvent;
    return {
      event,
      elapsed: event ? now - event.occurredAt : 0,
      envelope: heartbeatEnvelope(event, now)
    };
  }

  function heartbeatColor() {
    const direction = state.lastSignalChain?.input.directionVector.direction || state.approachDirection || "left";
    return revealDirections[direction].color;
  }

  function dispatchHeartbeatFieldEvent(fieldEvent) {
    engineState.heartbeatEvent = fieldEvent;
    const phase = fieldEvent.phase;
    document.body.dataset.heartbeatPhase = phase;
    [hubReactor, hubWheel, engineCore, voidCanvas, primeLogo, revealBox, primeDoor].forEach((element) => {
      if (element) element.dataset.heartbeatPhase = phase;
    });
    engineCore.style.setProperty("--heartbeat-pressure", String(fieldEvent.effects.engineCore.pressure));
    if (revealBox) revealBox.dataset.heartbeatTiming = fieldEvent.effects.revealEngine.timing;
    if (primeDoor) primeDoor.dataset.heartbeatTiming = fieldEvent.effects.descentEngine.timing;
    window.dispatchEvent(new CustomEvent("threshold:heartbeat-field", {
      detail: {
        ...fieldEvent,
        chamber: state.lastSignalChain?.input.chamberContext.chamber || null,
        direction: state.lastSignalChain?.input.directionVector.direction || state.approachDirection || null
      }
    }));
    emitEngineEvent(phase, { fieldEvent });
  }

  function clearHeartbeatFieldEvent(now) {
    const event = engineState.heartbeatEvent;
    if (!event || now <= event.occurredAt + event.durationMs) return;
    engineState.heartbeatEvent = null;
    delete document.body.dataset.heartbeatPhase;
    [hubReactor, hubWheel, engineCore, voidCanvas, primeLogo, revealBox, primeDoor].forEach((element) => {
      if (element) delete element.dataset.heartbeatPhase;
    });
    engineCore.style.removeProperty("--heartbeat-pressure");
    if (!engineState.reveal) engineCore.dataset.engineState = "latent";
  }

  function setPrimeState(primeState) {
    document.body.dataset.primeAtomState = primeState;
    if (primeLogo) primeLogo.dataset.logoState = primeState;
  }

  function updateHubActivation(now, exceptionalEvidence = {}) {
    const participantPresence = state.zone === "contact"
      ? 1
      : state.hoveredLink
        ? 0.75
        : state.zone === "approach"
          ? 0.3
          : 0;
    const signalCoherence = state.hoveredLink
      ? 0.9
      : state.zone === "contact"
        ? 0.82
        : state.zone === "approach"
          ? 0.32
          : 0;
    const previousStage = hubActivation.stage;
    hubActivation = advanceHubActivation(hubActivation, {
      observedAt: now,
      participantPresence,
      signalCoherence,
      assetProximity: 1,
      temporalAlignment: true,
      counterConditions: [],
      ...exceptionalEvidence
    });
    document.body.dataset.hubActivation = hubActivation.stage;
    if (hubReactor) hubReactor.dataset.hubActivation = hubActivation.stage;
    if (hubActivation.stage !== previousStage) {
      window.dispatchEvent(new CustomEvent("threshold:hub-activation", {
        detail: {
          from: previousStage,
          to: hubActivation.stage,
          reason: hubActivation.reason,
          prerequisites: hubActivation.prerequisites,
          observedAt: now
        }
      }));
    }
  }

  function receiveHubActivationCommand(event) {
    const { action, reason } = event.detail || {};
    if (action === "fail") {
      updateHubActivation(performance.now(), { failureReason: reason || "explicit-failure" });
    } else if (action === "transcend") {
      updateHubActivation(performance.now(), { transcendenceAuthorized: true });
    } else if (action === "reset") {
      updateHubActivation(performance.now(), { reset: true });
    }
  }

  function activateEngineReveal(reveal) {
    if (engineState.reveal) return;
    engineState.reveal = reveal;
    engineState.transitionStartedAt = reveal.startedAt + revealTiming.directional + reveal.theme.duration;
    engineState.pressure = 1;
    engineCore.dataset.engineState = "opening";
    engineCore.style.setProperty("--engine-pressure", "1");
    document.body.dataset.revealStage = "directional";
    document.body.dataset.revealDirection = reveal.direction;
    document.body.dataset.revealTheme = reveal.theme.id;
    document.body.classList.add("is-revealing");
    if (revealBox) revealBox.dataset.revealBoxState = "opening";
    setPrimeState("revealing");
    sessionStorage.setItem("threshold:reveal-event", JSON.stringify({
      activation: reveal.activation,
      category: reveal.category,
      direction: reveal.direction,
      destination: new URL(reveal.destination).pathname,
      theme: reveal.theme.id,
      fromFib: reveal.fromFib || null,
      toFib: reveal.toFib || null
    }));
    emitEngineEvent("reveal-generated", { reveal });
    window.setTimeout(
      () => window.location.assign(reveal.destination),
      reducedMotion.matches ? 0 : reveal.totalDuration
    );
  }

  function receiveHubSignal(event) {
    const { type } = event.detail;
    const signalChain = event.detail.signalChain;
    const pressureBySignal = {
      idle: 0.08,
      pulse: 0.34,
      charge: 0.7,
      resonance: 0.9,
      "reveal-request": 1
    };
    engineState.pressure = pressureBySignal[type] ?? engineState.pressure;
    engineCore.style.setProperty("--engine-pressure", engineState.pressure.toFixed(2));
    engineCore.dataset.engineSignal = type;
    if (signalChain) {
      engineState.timingScale = signalChain.engine.heartbeatSync.timingScale;
      engineCore.dataset.spinDirective = signalChain.primeAtom.spinDirective;
      engineCore.dataset.colorPulse = signalChain.primeAtom.colorPulse;
      engineCore.dataset.pressureWave = signalChain.engine.pressureWave;
      engineCore.dataset.ritualPayload = signalChain.engine.ritualPayload;
      window.dispatchEvent(new CustomEvent("threshold:engine-response", {
        detail: { ...event.detail, pressure: engineState.pressure }
      }));
    }
    if (type !== "reveal-request" && !engineState.reveal) {
      engineCore.dataset.engineState = type === "idle" ? "latent" : "receiving";
    }
  }

  function receiveEngineResponse(event) {
    const { signalChain, type } = event.detail;
    if (!signalChain) return;
    hubWheel.dataset.pulseSync = signalChain.hub.pulseSync.spinDirective;
    hubWheel.dataset.pressureResponse = signalChain.hub.pressureResponse;
    hubWheel.dataset.resonanceGlow = signalChain.hub.resonanceGlow.colorPulse;
    hubWheel.dataset.ritualTrigger = signalChain.hub.ritualTrigger;
    const wheelScale = type === "idle" ? 1 : type === "pulse" ? 0.99 : type === "charge" ? 1.015 : 1.025;
    engineState.signalScale = wheelScale;
    hubWheel.style.setProperty("--spoke-glow", type === "idle" ? "0" : "0.72");
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("threshold:hub-response", {
        detail: event.detail
      }));
    });
  }

  function receiveHubResponse(event) {
    const { signalChain, type } = event.detail;
    if (!signalChain) return;
    const environment = signalChain.environment;
    document.body.dataset.frameResponse = environment.fieldFrame.compression;
    document.body.dataset.environmentColor = environment.voidField.colorShift;
    if (voidCanvas) voidCanvas.dataset.voidResponse = environment.voidField.distortion;
    if (revealBox) revealBox.dataset.ritual = environment.revealEngine.ritual;
    const direction = signalChain.input.directionVector.direction;
    addPressureWave(
      signalChain.engine.pressureWave,
      type === "reveal-request" ? 1.2 : 0.7,
      { color: revealDirections[direction].color, motion: signalChain.engine.pressureWave }
    );
    if (type === "reveal-request") activateEngineReveal(event.detail.reveal);
  }

  function receiveEngineEvent(event) {
    const { type } = event.detail;
    if (type === "micro-pulse" || type === "heartbeat" || type === "flicker") {
      const fieldEvent = event.detail.fieldEvent;
      engineCore.dataset.engineState = type;
      const wave = type === "micro-pulse" ? "vertical" : type === "flicker" ? "spiral" : "radial";
      const strength = type === "micro-pulse" ? 0.24 : type === "flicker" ? 1.35 : 1;
      addPressureWave(type, strength, { color: heartbeatColor(), motion: wave });
    } else if (type === "descent") {
      hubReceptor.dataset.signal = "descent";
      engineCore.dataset.engineState = "descent";
      setPrimeState("descending");
      addPressureWave("descent", 1.4);
    } else {
      hubReceptor.dataset.signal = "reveal";
    }
  }

  window.addEventListener("threshold:hub-signal", receiveHubSignal);
  window.addEventListener("threshold:engine-response", receiveEngineResponse);
  window.addEventListener("threshold:hub-response", receiveHubResponse);
  window.addEventListener("threshold:hub-activation-command", receiveHubActivationCommand);
  window.addEventListener("threshold:engine-event", receiveEngineEvent);

  function emitSignal(type, detail = {}) {
    const metrics = wheelMetrics();
    const directionVector = createDirectionVector({
      pointerX: state.pointerX,
      pointerY: state.pointerY,
      previousX: state.previousPointerX,
      previousY: state.previousPointerY,
      elapsedMs: state.pointerElapsedMs,
      centerX: metrics.centerX,
      centerY: metrics.centerY,
      radius: metrics.radius
    });
    const category = detail.category || detail.reveal?.category || state.hoveredLink?.textContent || "";
    const input = {
      directionVector,
      activation: detail.reveal?.activation || detail.activation || type,
      chamberContext: createChamberContext(category)
    };
    const signalChain = buildPrimeAtomSignalChain(input);
    state.lastSignalChain = signalChain;
    hubReceptor.dataset.signal = type;
    window.dispatchEvent(new CustomEvent("threshold:prime-atom-signal", {
      detail: signalChain
    }));
    window.dispatchEvent(new CustomEvent("threshold:hub-signal", {
      detail: { type, zone: state.zone, signalChain, ...detail }
    }));
  }

  function setZone(nextZone, now) {
    if (nextZone === state.zone) {
      return;
    }
    state.previousZone = state.zone;
    state.zone = nextZone;
    document.body.dataset.reactorZone = nextZone;
    if (nextZone === "approach" || nextZone === "contact") {
      state.approachDirection = approachDirection();
      document.body.dataset.revealContext = state.approachDirection;
      setPrimeState(nextZone === "contact" ? "resonant" : "listening");
      if (primeDoor) primeDoor.dataset.doorState = nextZone === "contact" ? "open" : "listening";
      if (nextZone === "contact") state.doorUnlocked = true;
    } else if (nextZone === "idle") {
      state.approachDirection = null;
      state.selectedLink = null;
      delete document.body.dataset.revealContext;
      setPrimeState("resting");
      if (primeDoor) primeDoor.dataset.doorState = state.doorUnlocked ? "open" : "sealed";
    } else if (nextZone === "retreat") {
      setPrimeState("resting");
      if (primeDoor) primeDoor.dataset.doorState = state.doorUnlocked ? "open" : "sealed";
    }

    if (state.hoveredLink && (nextZone === "approach" || nextZone === "contact")) {
      emitSignal("resonance", {
        category: state.hoveredLink.textContent.trim(),
        angle: state.hoverAngle
      });
    } else if (nextZone === "approach") {
      emitSignal("pulse");
    } else if (nextZone === "contact") {
      emitSignal("charge");
    } else if (nextZone === "retreat") {
      state.retreatStartedAt = now;
      state.retreatFrom = state.rotation;
      state.retreatTo = Math.floor(state.rotation / 360) * 360;
      state.scatterStartedAt = now;
      emitSignal("idle");
    } else if (nextZone === "idle") {
      emitSignal("idle");
    }
  }

  function categoryAngle(link) {
    const metrics = wheelMetrics();
    const rect = link.getBoundingClientRect();
    return Math.atan2(
      rect.top + rect.height / 2 - metrics.centerY,
      rect.left + rect.width / 2 - metrics.centerX
    );
  }

  function setCategory(link) {
    state.hoveredLink = link;
    state.selectedLink = link;
    state.hoverAngle = categoryAngle(link);
    const category = link.textContent.trim().toLowerCase();
    voidState.signature = voidSignatures[category] || {
      color: [214, 168, 75],
      motion: "ripple"
    };
    document.body.dataset.voidSignature = voidState.signature.motion;
    const frequency = 0.75 + categoryLinks.indexOf(link) * 0.07;
    hubWheel.style.setProperty("--category-frequency", frequency.toFixed(2) + "s");
    emitSignal("resonance", {
      category: link.textContent.trim(),
      angle: state.hoverAngle,
      frequency
    });
  }

  function clearCategory(link) {
    if (state.hoveredLink !== link) {
      return;
    }
    state.hoveredLink = null;
    state.hoverAngle = null;
    voidState.signature = null;
    delete document.body.dataset.voidSignature;
    emitSignal(state.zone === "contact" ? "charge" : state.zone === "approach" ? "pulse" : "idle");
  }

  function beginReveal(event, link, activation = "activate", forcedDirection = null) {
    if (engineState.reveal || event?.defaultPrevented || event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      return;
    }
    const destination = link.href;
    if (!destination) {
      return;
    }
    event?.preventDefault();
    const startedAt = performance.now();
    const category = link.textContent.trim();
    const theme = revealThemes[category.toLowerCase()] || {
      id: "threshold-opening",
      color: [91, 222, 194],
      duration: 840
    };
    const direction = forcedDirection || approachDirection();
    const context = revealDirections[direction];
    const totalDuration = revealTiming.directional + theme.duration + revealTiming.transition;
    const descent = theme.id === "ring-descent"
      ? { fromFib: entryRing, toFib: descentRings[entryRing] }
      : {};
    emitSignal("reveal-request", {
      reveal: { activation, category, context, destination, direction, startedAt, theme, totalDuration, ...descent }
    });
  }

  categoryLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => setCategory(link));
    link.addEventListener("pointerleave", () => clearCategory(link));
    link.addEventListener("focus", () => setCategory(link));
    link.addEventListener("blur", () => clearCategory(link));
    link.addEventListener("click", (event) => beginReveal(event, link, event.pointerType === "touch" ? "tap" : "click"));
  });
  function revealHubEntry() {
    if (!hubEntryReveal || !hubEntryLink) return;
    hubEntryReveal.dataset.revealed = "true";
    hubEntryReveal.setAttribute("aria-hidden", "false");
    hubEntryLink.removeAttribute("tabindex");
    hubWheel.setAttribute("aria-expanded", "true");
    setPrimeState("resonant");
    hubEntryLink.focus({ preventScroll: true });
  }
  hubWheel.addEventListener("dblclick", revealHubEntry);
  hubWheel.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    revealHubEntry();
  });
  if (primeDoor) {
    primeDoor.addEventListener("focus", () => {
      state.doorUnlocked = true;
      primeDoor.dataset.doorState = "open";
      setPrimeState("resonant");
    });
    primeDoor.addEventListener("click", (event) => beginReveal(event, primeDoor, "door", "bottom"));
  }
  if (categoryLinks.includes(document.activeElement)) {
    setCategory(document.activeElement);
  }

  document.addEventListener("pointermove", (event) => {
    const movedAt = performance.now();
    state.previousPointerX = state.pointerX === -1000 ? event.clientX : state.pointerX;
    state.previousPointerY = state.pointerY === -1000 ? event.clientY : state.pointerY;
    state.pointerElapsedMs = Math.max(1, movedAt - state.pointerMovedAt);
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
    state.pointerMovedAt = movedAt;
  }, { passive: true });

  document.addEventListener("pointerdown", (event) => {
    state.gesture = { x: event.clientX, y: event.clientY };
  }, { passive: true });

  document.addEventListener("pointerup", (event) => {
    if (!state.gesture || !state.selectedLink || engineState.reveal) return;
    const deltaX = event.clientX - state.gesture.x;
    const deltaY = event.clientY - state.gesture.y;
    state.gesture = null;
    if (Math.hypot(deltaX, deltaY) < 72) return;
    const direction = Math.abs(deltaX) >= Math.abs(deltaY)
      ? deltaX < 0 ? "left" : "right"
      : deltaY < 0 ? "top" : "bottom";
    beginReveal(null, state.selectedLink, "gesture", direction);
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    state.pointerX = -1000;
    state.pointerY = -1000;
  });

  window.addEventListener("resize", resizeVoid, { passive: true });
  window.addEventListener("scroll", () => {
    voidState.scrollY = window.scrollY;
  }, { passive: true });

  function updateZone(now, metrics) {
    if (engineState.reveal) {
      return;
    }
    const distance = Math.hypot(state.pointerX - metrics.centerX, state.pointerY - metrics.centerY);
    if (distance <= metrics.radius) {
      setZone("contact", now);
      if (!state.contactStartedAt) state.contactStartedAt = now;
      if (state.selectedLink && now - state.contactStartedAt >= 320) {
        beginReveal(null, state.selectedLink, "tight-radius");
      }
    } else if (distance <= metrics.radius + 220) {
      state.contactStartedAt = 0;
      setZone("approach", now);
    } else if (state.zone === "approach" || state.zone === "contact") {
      state.contactStartedAt = 0;
      setZone("retreat", now);
    } else if (state.zone === "retreat" && now - state.retreatStartedAt >= 1200) {
      setZone("idle", now);
    }
    return distance;
  }

  function updateWheel(now, deltaSeconds, metrics, distance) {
    let proximity = 0;
    const stage = revealStage(now);
    const directionalContext = engineState.reveal?.context || revealDirections[state.approachDirection];
    if (engineState.reveal && stage === "directional") {
      state.rotation += 112 * (directionalContext.spin || 0.16) * engineState.timingScale * deltaSeconds;
      proximity = 1;
    } else if (engineState.reveal && stage === "chamber") {
      state.rotation += 34 * (directionalContext.spin || 0.2) * engineState.timingScale * deltaSeconds;
      proximity = 1;
    } else if (state.zone === "contact") {
      state.rotation += 15 * (directionalContext?.spin || 1) * engineState.timingScale * deltaSeconds;
      proximity = 1;
    } else if (state.zone === "approach") {
      proximity = clamp((metrics.radius + 220 - distance) / 220, 0, 1);
      state.rotation += (2 + proximity * 10) * (directionalContext?.spin || 0.2) * engineState.timingScale * deltaSeconds;
    } else if (state.zone === "retreat") {
      const progress = clamp((now - state.retreatStartedAt) / 1200, 0, 1);
      state.rotation = state.retreatFrom + (state.retreatTo - state.retreatFrom) * easeInOut(progress);
    }

    let vectorAngle = state.hoverAngle;
    if (vectorAngle === null && (state.zone === "approach" || state.zone === "contact")) {
      vectorAngle = Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX);
    }
    const revealTilt = engineState.reveal && stage === "directional" ? directionalContext.tilt || 0 : 0;
    const tiltStrength = state.hoveredLink ? 3 : state.zone === "contact" ? 3 : proximity * 1.6;
    const tiltX = (vectorAngle === null ? 0 : -Math.sin(vectorAngle) * tiltStrength) + revealTilt * 3;
    const tiltY = vectorAngle === null ? 0 : Math.cos(vectorAngle) * tiltStrength;
    const charge = state.hoveredLink ? 0.9 : state.zone === "contact" ? 0.82 : state.zone === "approach" ? 0.3 + proximity * 0.36 : 0;
    const heartbeat = heartbeatSnapshot(now);
    const heartbeatEffects = heartbeat.event?.effects;
    const heartbeatScale = heartbeatEffects
      ? 1 + (heartbeatEffects.hub.wheelScale - 1) * heartbeat.envelope
      : 1;
    const electronExpansion = (heartbeatEffects?.primeAtom.electronExpansion || 0) * heartbeat.envelope;
    const coreScale = (stage === "transition" ? 1.08 : 1 + proximity * 0.05)
      + (heartbeatEffects?.primeAtom.nucleusBrightness || 0) * heartbeat.envelope * 0.035;
    const direction = state.lastSignalChain?.input.directionVector.direction || state.approachDirection;
    const directionalTilt = heartbeat.event?.phase === "heartbeat"
      ? (direction === "top" ? 0.7 : direction === "bottom" ? -0.7 : 0) * heartbeat.envelope
      : 0;
    const anomalyTilt = heartbeat.event?.phase === "flicker" ? heartbeat.envelope : 0;

    hubWheel.style.setProperty("--wheel-rotation", state.rotation.toFixed(3) + "deg");
    hubWheel.style.setProperty("--wheel-tilt-x", (tiltX + directionalTilt).toFixed(3) + "deg");
    hubWheel.style.setProperty("--wheel-tilt-y", (tiltY + anomalyTilt).toFixed(3) + "deg");
    hubWheel.style.setProperty("--wheel-scale", (engineState.signalScale * heartbeatScale).toFixed(4));
    hubWheel.style.setProperty("--core-scale", coreScale.toFixed(3));
    hubWheel.style.setProperty("--core-glow", (0.18 + charge * 0.42 + heartbeat.envelope * 0.18).toFixed(3));
    hubWheel.style.setProperty("--electron-expansion", electronExpansion.toFixed(4));
    const spokeGlow = Math.max(state.hoveredLink ? 0.56 : charge * 0.32, (heartbeatEffects?.hub.spokeGlow || 0) * heartbeat.envelope).toFixed(3);
    const heartbeatRgb = heartbeatColor().join(", ");
    hubWheel.style.setProperty("--spoke-glow", spokeGlow);
    if (hubReactor) {
      hubReactor.style.setProperty("--spoke-glow", spokeGlow);
      hubReactor.style.setProperty("--heartbeat-color-rgb", heartbeatRgb);
    }
    hubWheel.style.setProperty("--receptor-charge", charge.toFixed(3));
    hubReceptor.style.setProperty("--receptor-charge", charge.toFixed(3));
    if (primeLogo) {
      primeLogo.style.setProperty("--logo-charge", charge.toFixed(3));
      primeLogo.style.setProperty("--logo-direction", (tiltY * 0.8).toFixed(3));
    }
  }

  function updateNodes(now, metrics) {
    const seconds = now / 1000;
    const heartbeat = heartbeatSnapshot(now);
    const nodeEffects = heartbeat.event?.effects.orbitNodes;
    const hoverSpread = 0.12;
    const scatterProgress = state.scatterStartedAt
      ? clamp((now - state.scatterStartedAt) / 1050, 0, 1)
      : 1;
    const scatterStrength = Math.sin(scatterProgress * Math.PI) * (1 - scatterProgress);
    const escapePhase = (now % 38000) / 38000;
    const escapingIndex = Math.floor(now / 38000) % nodeCount;
    const descendingProgress = engineState.transitionStartedAt
      ? clamp((now - engineState.transitionStartedAt) / 380, 0, 1)
      : 0;

    nodes.forEach((node, index) => {
      const idleRadius = metrics.radius * (0.34 + (index % 3) * 0.09);
      const pixelsPerSecond = 8 + (index % 5);
      const angularSpeed = pixelsPerSecond / idleRadius;
      const freeze = nodeEffects && heartbeat.elapsed < nodeEffects.freezeMs;
      const nodeSeconds = freeze
        ? heartbeat.event.occurredAt / 1000
        : seconds + Math.max(0, heartbeat.elapsed - (nodeEffects?.freezeMs || 0)) / 1000 * ((nodeEffects?.acceleration || 1) - 1);
      const idleAngle = index / nodeCount * Math.PI * 2 + nodeSeconds * angularSpeed;
      let angle = idleAngle;
      let radius = idleRadius + Math.sin(seconds * 0.7 + index * 1.9) * 7;
      let opacity = 0.24;
      let scale = 1;
      if (heartbeat.event) {
        radius *= 1 + heartbeat.event.effects.primeAtom.electronExpansion * heartbeat.envelope;
        if (heartbeat.event.phase === "micro-pulse") radius += Math.sin(index * 2.1) * heartbeat.envelope * 1.5;
        if (heartbeat.event.phase === "flicker" && !freeze) {
          angle += Math.sin(index * 8.7 + now * 0.08) * heartbeat.envelope * 0.035;
          radius += Math.cos(index * 5.3 + now * 0.06) * heartbeat.envelope * 3;
        }
      }

      if (state.zone === "approach" || state.zone === "contact") {
        const cursorAngle = Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX);
        angle += Math.sin(cursorAngle - angle) * (state.zone === "contact" ? 0.24 : 0.14);
        radius += state.zone === "contact" ? 9 : 4;
        opacity = state.zone === "contact" ? 0.42 : 0.34;
      }
      if (state.hoverAngle !== null) {
        angle = state.hoverAngle + (index - (nodeCount - 1) / 2) * hoverSpread;
        radius = metrics.radius * (0.39 + (index % 2) * 0.04);
        opacity = 0.46;
        scale = 1.12;
      }
      if (state.zone === "retreat") {
        radius += (22 + (index % 4) * 6) * scatterStrength;
      }
      if (index === escapingIndex && escapePhase < 0.09 && state.zone === "idle") {
        const escapeProgress = escapePhase / 0.09;
        radius += Math.sin(escapeProgress * Math.PI) * (72 + (index % 3) * 18);
        opacity = 0.18 + Math.abs(Math.sin(escapeProgress * Math.PI * 7)) * 0.5;
      }
      if (engineState.reveal && revealStage(now) === "chamber" && engineState.reveal.theme.id === "cycle-burst") {
        const burstProgress = clamp((now - engineState.reveal.startedAt - revealTiming.directional) / engineState.reveal.theme.duration, 0, 1);
        radius += Math.sin(burstProgress * Math.PI) * metrics.radius * 0.58;
        opacity = 0.68;
      }
      if (descendingProgress > 0) {
        radius *= 1 - easeInOut(descendingProgress);
        opacity = 0.55 * (1 - descendingProgress);
        scale = 1 + descendingProgress * 0.8;
      }

      node.style.setProperty("--node-x", (Math.cos(angle) * radius).toFixed(2) + "px");
      node.style.setProperty("--node-y", (Math.sin(angle) * radius).toFixed(2) + "px");
      node.style.setProperty("--node-opacity", opacity.toFixed(3));
      node.style.setProperty("--node-scale", scale.toFixed(3));
    });

    if (state.zone === "contact" && now - state.lastSparkAt > 2800) {
      state.lastSparkAt = now;
      const node = nodes[Math.floor(now / 2800) % nodeCount];
      node.classList.remove("is-sparking");
      requestAnimationFrame(() => node.classList.add("is-sparking"));
      window.setTimeout(() => node.classList.remove("is-sparking"), 650);
    }
  }

  function framePoint(progress, inset, width, height) {
    const frameWidth = width - inset * 2;
    const frameHeight = height - inset * 2;
    const perimeter = frameWidth * 2 + frameHeight * 2;
    let distance = progress * perimeter;
    if (distance <= frameWidth) return { x: inset + distance, y: inset };
    distance -= frameWidth;
    if (distance <= frameHeight) return { x: width - inset, y: inset + distance };
    distance -= frameHeight;
    if (distance <= frameWidth) return { x: width - inset - distance, y: height - inset };
    distance -= frameWidth;
    return { x: inset, y: height - inset - distance };
  }

  function drawFieldFrame(context, now, deltaSeconds, metrics, activity, signature) {
    const width = voidState.width;
    const height = voidState.height;
    const seconds = now / 1000;
    const heartbeat = heartbeatSnapshot(now);
    const primaryPulse = heartbeat.event?.phase === "heartbeat" ? heartbeat.envelope : 0;
    const anomalyPulse = heartbeat.event?.phase === "flicker" ? heartbeat.envelope : 0;
    const microPulse = heartbeat.event?.phase === "micro-pulse" ? heartbeat.envelope : 0;
    const retreatFade = state.zone === "retreat" ? 0.55 : 1;
    const descentProgress = engineState.transitionStartedAt
      ? clamp((now - engineState.transitionStartedAt) / 420, 0, 1)
      : 0;
    const inset = clamp(Math.min(width, height) * 0.026, 13, 28) + descentProgress * 5;
    const baseScale = 0.995 + microPulse * 0.005 - primaryPulse * 0.008;
    const frameScale = engineState.transitionStartedAt ? baseScale - descentProgress * 0.006 : baseScale;
    const influenceAngle = state.hoverAngle !== null
      ? state.hoverAngle
      : state.zone === "contact" || state.zone === "approach"
        ? Math.atan2(state.pointerY - metrics.centerY, state.pointerX - metrics.centerX)
        : 0;
    const tilt = (state.zone === "contact" ? Math.cos(influenceAngle) * Math.PI / 120 : 0)
      + anomalyPulse * Math.PI / 180;
    const signatureColor = signature?.color || [31, 59, 255];
    const goldOpacity = (0.09 + activity * 0.07 + primaryPulse * 0.07 + anomalyPulse * 0.12 + microPulse * 0.02) * retreatFade;
    const blueOpacity = (0.08 + activity * 0.09 + primaryPulse * 0.08 + microPulse * 0.02) * retreatFade;
    const rippleStrength = (state.hoveredLink ? 3.4 : state.zone === "contact" ? 2.4 : activity * 1.3)
      + primaryPulse * 2.2 + anomalyPulse * 1.4;
    const steps = width < 600 ? 96 : 152;

    context.save();
    context.translate(width / 2, height / 2);
    context.rotate(tilt);
    context.scale(frameScale, frameScale);
    context.translate(-width / 2, -height / 2);
    context.beginPath();
    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      const point = framePoint(progress, inset, width, height);
      const organic = Math.sin(progress * Math.PI * 18 + seconds * 0.16) * 0.75
        + Math.sin(progress * Math.PI * 37 - seconds * 0.09) * 0.38
        + Math.sin(progress * Math.PI * 8 - seconds * 2.4) * primaryPulse * 1.6;
      let rippleX = 0;
      let rippleY = 0;
      if (signature?.motion === "vertical") rippleX = Math.sin(point.y * 0.035 + seconds * 1.4) * rippleStrength;
      if (signature?.motion === "horizontal") rippleY = Math.sin(point.x * 0.035 + seconds * 1.4) * rippleStrength;
      if (signature?.motion === "spiral") {
        rippleX = Math.cos(progress * Math.PI * 8 + seconds) * rippleStrength;
        rippleY = Math.sin(progress * Math.PI * 8 + seconds) * rippleStrength;
      }
      if (signature?.motion === "ripple") rippleY = Math.sin(progress * Math.PI * 12 + seconds * 2.2) * rippleStrength * 0.7;
      if (signature?.motion === "radiating") {
        rippleX = Math.cos(progress * Math.PI * 2) * rippleStrength;
        rippleY = Math.sin(progress * Math.PI * 2) * rippleStrength;
      }
      if (microPulse && point.y === inset) rippleY -= Math.sin(progress * Math.PI * 10) * microPulse * 1.5;
      const x = point.x + rippleX + (point.x < width / 2 ? -organic : organic);
      const y = point.y + rippleY + (point.y < height / 2 ? -organic : organic);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.lineWidth = 3;
    context.strokeStyle = `rgba(214,168,75,${goldOpacity})`;
    context.shadowColor = `rgba(214,168,75,${goldOpacity * 1.8})`;
    context.shadowBlur = 8 + activity * 8;
    context.stroke();
    context.lineWidth = 1.15;
    context.strokeStyle = `rgba(${signatureColor.join(",")},${blueOpacity})`;
    context.shadowColor = `rgba(${signatureColor.join(",")},${blueOpacity * 2.2})`;
    context.shadowBlur = 12 + activity * 12;
    context.stroke();

    if (engineState.reveal && revealStage(now) === "directional") {
      const glow = engineState.reveal.context.glow;
      const color = engineState.reveal.context.color;
      context.beginPath();
      if (glow === "left" || glow === "right") {
        const x = glow === "left" ? inset : width - inset;
        context.moveTo(x, height * 0.24);
        context.lineTo(x, height * 0.76);
      } else {
        const y = glow === "top" ? inset : height - inset;
        context.moveTo(width * 0.24, y);
        context.lineTo(width * 0.76, y);
      }
      context.lineWidth = 2.2;
      context.strokeStyle = `rgba(${color.join(",")},0.58)`;
      context.shadowColor = `rgba(${color.join(",")},0.9)`;
      context.shadowBlur = 28;
      context.stroke();
    }

    const frameSpeed = 1 + activity * 3.4;
    const escapePhase = (now % 37000) / 37000;
    voidState.frameParticles.forEach((particle, index) => {
      particle.progress = (particle.progress + particle.speed * deltaSeconds * 1000 * frameSpeed) % 1;
      const point = framePoint(particle.progress, inset, width, height);
      let escape = 0;
      if (index === 0 && escapePhase < 0.06) {
        escape = Math.sin(escapePhase / 0.06 * Math.PI) * 24;
      }
      const directionX = point.x === inset ? -1 : point.x === width - inset ? 1 : 0;
      const directionY = point.y === inset ? -1 : point.y === height - inset ? 1 : 0;
      context.beginPath();
      context.arc(point.x + directionX * escape, point.y + directionY * escape, particle.size, 0, Math.PI * 2);
      const color = particle.gold ? [214, 168, 75] : signatureColor;
      context.fillStyle = `rgba(${color.join(",")},${0.07 + activity * 0.08})`;
      context.fill();
    });
    context.restore();
  }

  function drawRevealEffect(context, now, metrics) {
    if (!engineState.reveal) return;
    const stage = revealStage(now);
    const elapsed = now - engineState.reveal.startedAt;
    const centerX = metrics.centerX;
    const centerY = metrics.centerY;
    const directionColor = engineState.reveal.context.color;
    const themeColor = engineState.reveal.theme.color;
    context.save();
    context.translate(centerX, centerY);

    if (stage === "directional") {
      const progress = clamp(elapsed / revealTiming.directional, 0, 1);
      const horizontal = engineState.reveal.context.distortion === "horizontal";
      context.scale(horizontal ? 1.4 : 0.72, horizontal ? 0.72 : 1.4);
      context.beginPath();
      context.arc(0, 0, 28 + progress * Math.max(voidState.width, voidState.height) * 0.36, 0, Math.PI * 2);
      context.strokeStyle = `rgba(${directionColor.join(",")},${(1 - progress) * 0.42})`;
      context.lineWidth = 1.5;
      context.shadowColor = `rgba(${directionColor.join(",")},0.7)`;
      context.shadowBlur = 22;
      context.stroke();
      context.restore();
      return;
    }

    if (stage !== "chamber") {
      context.restore();
      return;
    }
    const progress = clamp((elapsed - revealTiming.directional) / engineState.reveal.theme.duration, 0, 1);
    const pulse = Math.sin(progress * Math.PI);
    const color = themeColor.join(",");
    context.strokeStyle = `rgba(${color},${0.18 + pulse * 0.5})`;
    context.fillStyle = `rgba(${color},${0.08 + pulse * 0.34})`;
    context.shadowColor = `rgba(${color},0.72)`;
    context.shadowBlur = 18;
    context.lineWidth = 1.2;

    if (engineState.reveal.theme.id === "root-bloom") {
      for (let index = 0; index < 12; index += 1) {
        const angle = index / 12 * Math.PI * 2;
        const radius = 22 + pulse * (54 + index * 2);
        context.save();
        context.rotate(angle);
        context.beginPath();
        context.ellipse(radius, 0, 14 * pulse, 4, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }
      for (let index = 0; index < 7; index += 1) {
        context.beginPath();
        context.moveTo((index - 3) * 12, 8);
        context.quadraticCurveTo((index - 3) * 20, 48, Math.sin(index * 3) * 46, 110 * pulse);
        context.stroke();
      }
    } else if (engineState.reveal.theme.id === "glyphfall-alignment" || engineState.reveal.theme.id === "firefall-origin") {
      for (let index = 0; index < 9; index += 1) {
        const y = -160 + ((progress * 360 + index * 43) % 320);
        const x = (1 - progress) * Math.sin(index * 2.4) * 70;
        context.save();
        context.translate(x, y);
        context.rotate(engineState.reveal.theme.id === "firefall-origin" ? progress * Math.PI * 2 + index : 0);
        context.strokeRect(-5, -5, 10, 10);
        context.restore();
      }
      context.beginPath();
      context.moveTo(0, -150);
      context.lineTo(0, 150);
      context.stroke();
    } else if (engineState.reveal.theme.id === "cycle-burst" || engineState.reveal.theme.id === "ring-descent") {
      for (let index = 0; index < 4; index += 1) {
        context.beginPath();
        const direction = engineState.reveal.theme.id === "ring-descent" ? 1 - progress : progress;
        context.arc(0, 0, 35 + direction * (80 + index * 34), 0, Math.PI * 2);
        context.stroke();
      }
    } else if (engineState.reveal.theme.id === "drift-scatter") {
      for (let index = 0; index < 30; index += 1) {
        const angle = index * 2.4 + progress * Math.PI * 3;
        const radius = progress * (28 + index * 4.2);
        context.beginPath();
        context.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 1.4, 0, Math.PI * 2);
        context.fill();
      }
    } else if (engineState.reveal.theme.id === "threshold-opening") {
      const opening = 18 + progress * 92;
      context.fillRect(-opening - 54, -170, 54, 340);
      context.fillRect(opening, -170, 54, 340);
      context.strokeRect(-opening, -130, opening * 2, 260);
    } else if (engineState.reveal.theme.id === "symbol-cascade") {
      for (let row = -3; row <= 3; row += 1) {
        for (let column = -3; column <= 3; column += 1) {
          const delay = (row + column + 6) / 12;
          if (progress < delay * 0.45) continue;
          context.save();
          context.translate(column * 30, row * 30 + (1 - progress) * -70);
          context.rotate((row + column) % 2 ? Math.PI / 4 : 0);
          context.strokeRect(-5, -5, 10, 10);
          context.restore();
        }
      }
    } else if (engineState.reveal.theme.id === "signal-oscillation") {
      context.beginPath();
      for (let x = -180; x <= 180; x += 4) {
        const y = Math.sin(x * 0.055 + progress * Math.PI * 8) * 34 * pulse;
        if (x === -180) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    } else if (engineState.reveal.theme.id === "transmission-burst") {
      for (let index = 0; index < 18; index += 1) {
        const angle = index / 18 * Math.PI * 2;
        context.beginPath();
        context.moveTo(Math.cos(angle) * 28, Math.sin(angle) * 28);
        context.lineTo(Math.cos(angle) * (45 + progress * 150), Math.sin(angle) * (45 + progress * 150));
        context.stroke();
      }
      context.strokeRect(-12, -12, 24, 24);
    }
    context.restore();
  }

  function drawVoid(now, deltaSeconds, metrics, staticFrame = false) {
    if (!voidContext || (reducedMotion.matches && !staticFrame)) {
      return;
    }
    const context = voidContext;
    const width = voidState.width;
    const height = voidState.height;
    const centerX = metrics.centerX;
    const centerY = metrics.centerY;
    const stage = revealStage(now);
    const activity = stage === "transition" ? 1.5
      : engineState.reveal ? 1.12
      : state.hoveredLink ? 1
      : state.zone === "contact" ? 0.82
      : state.zone === "approach" ? 0.46
      : state.zone === "retreat" ? 0.12 : 0.2;
    const directionalSignature = state.approachDirection ? {
      color: revealDirections[state.approachDirection].color,
      motion: revealDirections[state.approachDirection].distortion
    } : null;
    const signature = engineState.reveal && stage === "directional" ? {
      color: engineState.reveal.context.color,
      motion: engineState.reveal.context.distortion
    } : voidState.signature || directionalSignature;
    const fieldColor = signature?.color || [31, 59, 255];
    context.clearRect(0, 0, width, height);

    const field = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.72);
    field.addColorStop(0, `rgba(${fieldColor.join(",")},${0.025 + activity * 0.025})`);
    field.addColorStop(0.48, "rgba(10,15,43,0.055)");
    field.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = field;
    context.fillRect(0, 0, width, height);

    drawFieldFrame(context, now, deltaSeconds, metrics, activity, signature);
    drawRevealEffect(context, now, metrics);

    const veinPulse = 0.5 + 0.5 * Math.sin(now / 1000 * Math.PI * 2 / 21);
    const veinOpacity = 0.028 + veinPulse * 0.026 + activity * 0.045;
    context.lineWidth = 0.7;
    for (let index = 0; index < 7; index += 1) {
      const baseAngle = index / 7 * Math.PI * 2 + state.rotation * Math.PI / 180 * 0.08;
      const targetAngle = state.hoverAngle === null ? baseAngle : baseAngle * 0.35 + state.hoverAngle * 0.65;
      const reach = Math.max(width, height) * 0.78;
      context.beginPath();
      context.moveTo(centerX, centerY);
      for (let step = 1; step <= 5; step += 1) {
        const distance = reach * step / 5;
        const bend = Math.sin(index * 4.7 + step * 2.2) * 13;
        context.lineTo(
          centerX + Math.cos(targetAngle) * distance + Math.cos(targetAngle + Math.PI / 2) * bend,
          centerY + Math.sin(targetAngle) * distance + Math.sin(targetAngle + Math.PI / 2) * bend
        );
      }
      context.strokeStyle = `rgba(214,168,75,${veinOpacity})`;
      context.stroke();
    }

    voidState.waves = voidState.waves.filter((wave) => now - wave.bornAt < 3600);
    voidState.waves.forEach((wave) => {
      const progress = (now - wave.bornAt) / 3600;
      const radius = 24 + progress * Math.max(width, height) * 0.62;
      const color = wave.signature?.color || [214, 168, 75];
      context.save();
      context.translate(centerX, centerY);
      if (wave.signature?.motion === "vertical") context.scale(0.62, 1.35);
      if (wave.signature?.motion === "horizontal") context.scale(1.35, 0.62);
      if (wave.signature?.motion === "spiral") context.rotate(progress * Math.PI * 1.6);
      context.beginPath();
      if (wave.signature?.motion === "spiral") {
        for (let angle = 0; angle < Math.PI * 4; angle += 0.15) {
          const spiralRadius = radius * angle / (Math.PI * 4);
          context.lineTo(Math.cos(angle) * spiralRadius, Math.sin(angle) * spiralRadius);
        }
      } else {
        context.arc(0, 0, radius, 0, Math.PI * 2);
      }
      context.strokeStyle = `rgba(${color.join(",")},${(1 - progress) * 0.075 * wave.strength})`;
      context.lineWidth = wave.type === "descent" ? 1.4 : 0.8;
      context.stroke();
      context.restore();
    });

    const descentProgress = engineState.transitionStartedAt
      ? clamp((now - engineState.transitionStartedAt) / 420, 0, 1)
      : 0;
    voidState.particles.forEach((particle, index) => {
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      const speed = particle.drift * (1 + activity * 2.4);
      let velocityX = Math.cos(particle.phase + now / 17000) * speed;
      let velocityY = Math.sin(particle.phase * 1.3 + now / 21000) * speed + 0.04;
      const heartbeat = heartbeatSnapshot(now);
      if (heartbeat.event?.phase === "micro-pulse") velocityY -= heartbeat.envelope * 0.12;
      if (signature?.motion === "vertical") velocityY -= speed * 1.1;
      if (signature?.motion === "horizontal") velocityX += speed * 1.2;
      if (signature?.motion === "ripple") velocityY += Math.sin(now / 360 + index) * speed;
      const deltaX = particle.x - centerX;
      const deltaY = particle.y - centerY;
      const distance = Math.max(24, Math.hypot(deltaX, deltaY));
      if (heartbeat.event?.phase === "heartbeat") {
        velocityX += deltaX / distance * heartbeat.envelope * 0.9;
        velocityY += deltaY / distance * heartbeat.envelope * 0.9;
      }
      if (heartbeat.event?.phase === "flicker") {
        velocityX *= -1 - heartbeat.envelope;
        velocityY *= -1 - heartbeat.envelope;
      }
      if (signature?.motion === "spiral") {
        velocityX += -deltaY / distance * speed * 1.5;
        velocityY += deltaX / distance * speed * 1.5;
      }
      if (signature?.motion === "radiating") {
        velocityX += deltaX / distance * speed * 2;
        velocityY += deltaY / distance * speed * 2;
      }
      if (state.hoverAngle !== null) {
        const targetX = centerX + Math.cos(state.hoverAngle) * metrics.radius * 1.35;
        const targetY = centerY + Math.sin(state.hoverAngle) * metrics.radius * 1.35;
        velocityX += (targetX - particle.x) * 0.0008;
        velocityY += (targetY - particle.y) * 0.0008;
      }
      if (state.zone === "retreat") {
        velocityX += deltaX / distance * 0.8;
        velocityY += deltaY / distance * 0.8;
      }
      if (descentProgress > 0) {
        velocityX += (centerX - particle.x) * 0.04 * descentProgress;
        velocityY += (centerY - particle.y) * 0.04 * descentProgress;
      }
      particle.x += velocityX * deltaSeconds * 60;
      particle.y += velocityY * deltaSeconds * 60;
      particle.y -= voidState.scrollY * 0.00006 * (index % 5);
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;
      if (particle.y < -8) particle.y = height + 8;
      if (particle.y > height + 8) particle.y = -8;
      const flicker = 0.055 + (0.5 + 0.5 * Math.sin(now / 900 + particle.phase)) * 0.07;
      const particleColor = particle.gold ? [214, 168, 75] : [83, 126, 255];
      if (activity > 0.45) {
        context.beginPath();
        context.moveTo(particle.previousX, particle.previousY);
        context.lineTo(particle.x, particle.y);
        context.strokeStyle = `rgba(${particleColor.join(",")},${flicker * activity * 0.45})`;
        context.stroke();
      }
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(${particleColor.join(",")},${flicker})`;
      context.fill();
    });

  }

  function animate(now) {
    const deltaSeconds = clamp((now - state.lastFrameAt) / 1000, 0, 0.05);
    state.lastFrameAt = now;
    const metrics = wheelMetrics();
    clearHeartbeatFieldEvent(now);
    advanceHeartbeatClock(heartbeatClock, now).forEach(dispatchHeartbeatFieldEvent);
    const distance = updateZone(now, metrics);
    updateHubActivation(now);
    if (engineState.reveal) {
      const stage = revealStage(now);
      if (document.body.dataset.revealStage !== stage) {
        document.body.dataset.revealStage = stage;
        if (stage === "transition") {
          document.body.classList.add("is-void-descending");
          hubWheel.classList.add("is-descending");
          if (revealBox) revealBox.dataset.revealBoxState = "descending";
        }
        emitEngineEvent(stage === "transition" ? "descent" : "reveal-stage", {
          category: engineState.reveal.category,
          direction: engineState.reveal.direction,
          fromFib: engineState.reveal.fromFib || null,
          stage,
          theme: engineState.reveal.theme,
          toFib: engineState.reveal.toFib || null
        });
      }
    }
    if (!reducedMotion.matches) {
      updateWheel(now, deltaSeconds, metrics, distance);
      updateNodes(now, metrics);
      drawVoid(now, deltaSeconds, metrics);
    }
    state.frameId = requestAnimationFrame(animate);
  }

  document.body.dataset.reactorZone = "idle";
  setPrimeState("resting");
  updateHubActivation(performance.now());
  resizeVoid();
  emitSignal("idle");
  state.frameId = requestAnimationFrame(animate);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(state.frameId);
    window.removeEventListener("threshold:hub-signal", receiveHubSignal);
    window.removeEventListener("threshold:engine-response", receiveEngineResponse);
    window.removeEventListener("threshold:hub-response", receiveHubResponse);
    window.removeEventListener("threshold:hub-activation-command", receiveHubActivationCommand);
    window.removeEventListener("threshold:engine-event", receiveEngineEvent);
  }, { once: true });
}

initializeHubReactor();

if (routeLinks.length) {
  fetch("config/fibonacci-routes.json", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Fibonacci routes unavailable (" + response.status + ")");
      }
      return response.json();
    })
    .then((config) => {
      routeLinks.forEach((link) => {
        const lineage = resolveFibonacciRoute(
          config,
          link.dataset.fibonacciSpoke,
          link.dataset.fibonacciPath
        );
        link.href = buildFibonacciUrl(lineage, link.getAttribute("href"));
        link.addEventListener("click", () => {
          sessionStorage.setItem("threshold.fibonacci.lineage", JSON.stringify(lineage));
        });
      });
    })
    .catch((error) => {
      console.error(error);
    });
}