export const ENGINE_HEARTBEAT_MS = 12000;

export const DIRECTION_PROFILES = Object.freeze({
  left: Object.freeze({ spinDirective: "clockwise", colorPulse: "blue", pressureWave: "horizontal" }),
  right: Object.freeze({ spinDirective: "counter-clockwise", colorPulse: "gold", pressureWave: "horizontal" }),
  top: Object.freeze({ spinDirective: "tilt-down", colorPulse: "cyan", pressureWave: "vertical" }),
  bottom: Object.freeze({ spinDirective: "tilt-up", colorPulse: "amber", pressureWave: "vertical" })
});

const CHAMBER_PROFILES = Object.freeze({
  "house and garden": Object.freeze({ ritual: "petals", frequency: 0.75 }),
  ethos: Object.freeze({ ritual: "glyphfall", frequency: 0.82 }),
  "learning wheel": Object.freeze({ ritual: "cycle-burst", frequency: 0.89 }),
  discover: Object.freeze({ ritual: "drift-scatter", frequency: 0.96 }),
  invitation: Object.freeze({ ritual: "threshold-opening", frequency: 1.03 }),
  mythology: Object.freeze({ ritual: "firefall", frequency: 1.1 }),
  glyphs: Object.freeze({ ritual: "symbol-cascade", frequency: 1.17 }),
  dialogues: Object.freeze({ ritual: "signal-oscillation", frequency: 1.24 }),
  contact: Object.freeze({ ritual: "transmission-burst", frequency: 1.31 }),
  "enter engine": Object.freeze({ ritual: "ring-descent", frequency: 1.38 })
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createDirectionVector({
  pointerX,
  pointerY,
  previousX = pointerX,
  previousY = pointerY,
  elapsedMs = 16,
  centerX,
  centerY,
  radius,
  approachRange = 220
}) {
  const deltaX = pointerX - centerX;
  const deltaY = pointerY - centerY;
  const distance = Math.hypot(deltaX, deltaY);
  const direction = Math.abs(deltaX) >= Math.abs(deltaY)
    ? deltaX < 0 ? "left" : "right"
    : deltaY < 0 ? "top" : "bottom";
  const movement = Math.hypot(pointerX - previousX, pointerY - previousY);

  return {
    angle: Math.atan2(deltaY, deltaX),
    direction,
    proximity: clamp((radius + approachRange - distance) / approachRange, 0, 1),
    speed: movement / Math.max(1, elapsedMs)
  };
}

export function createChamberContext(category) {
  const chamber = String(category || "").trim().toLowerCase();
  const profile = CHAMBER_PROFILES[chamber] || {
    ritual: "threshold-opening",
    frequency: 1
  };
  return { chamber, ...profile };
}

export function processPrimeAtomInput({ directionVector, activation, chamberContext }) {
  const direction = DIRECTION_PROFILES[directionVector.direction] || DIRECTION_PROFILES.left;
  return {
    spinDirective: direction.spinDirective,
    colorPulse: direction.colorPulse,
    ritualRequest: chamberContext.ritual,
    activation,
    chamberContext,
    directionVector
  };
}

export function createEngineResponse(primeAtom) {
  const direction = DIRECTION_PROFILES[primeAtom.directionVector.direction] || DIRECTION_PROFILES.left;
  const timingScale = clamp(
    1 + primeAtom.directionVector.speed * 0.5 + primeAtom.directionVector.proximity * 0.15,
    1,
    2
  );
  return {
    heartbeatSync: {
      intervalMs: ENGINE_HEARTBEAT_MS,
      spinDirective: primeAtom.spinDirective,
      timingScale
    },
    pressureWave: direction.pressureWave,
    resonanceShift: {
      chamber: primeAtom.chamberContext.chamber,
      frequency: primeAtom.chamberContext.frequency,
      colorPulse: primeAtom.colorPulse
    },
    ritualPayload: primeAtom.ritualRequest
  };
}

export function createHubResponse(engine) {
  const pressureResponse = engine.pressureWave === "horizontal"
    ? "compress-horizontal"
    : engine.pressureWave === "vertical"
      ? "compress-vertical"
      : engine.pressureWave;
  return {
    pulseSync: engine.heartbeatSync,
    pressureResponse,
    resonanceGlow: engine.resonanceShift,
    ritualTrigger: engine.ritualPayload
  };
}

export function createEnvironmentalResponse(hub) {
  return {
    voidField: {
      colorShift: hub.resonanceGlow.colorPulse,
      distortion: hub.pressureResponse,
      particleBehavior: hub.ritualTrigger,
      wavePropagation: hub.pressureResponse,
      shimmer: true,
      collapse: hub.ritualTrigger === "ring-descent"
    },
    fieldFrame: {
      glow: hub.resonanceGlow.colorPulse,
      ripple: hub.pressureResponse,
      compression: hub.pressureResponse,
      flicker: true,
      directionalHighlight: true
    },
    revealEngine: { ritual: hub.ritualTrigger },
    descentEngine: { armed: true, ritual: hub.ritualTrigger }
  };
}

export function buildPrimeAtomSignalChain(input) {
  const primeAtom = processPrimeAtomInput(input);
  const engine = createEngineResponse(primeAtom);
  const hub = createHubResponse(engine);
  const environment = createEnvironmentalResponse(hub);
  return { input, primeAtom, engine, hub, environment };
}