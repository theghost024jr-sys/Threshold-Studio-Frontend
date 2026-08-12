export const MICRO_PULSE_MS = 3000;
export const PRIMARY_HEARTBEAT_MS = 12000;
export const FLICKER_MIN_MS = 18000;
export const FLICKER_MAX_MS = 24000;

export const HEARTBEAT_PHASES = Object.freeze({
  "micro-pulse": Object.freeze({
    durationMs: 640,
    intensity: 0.2,
    primeAtom: Object.freeze({ electronExpansion: 0.015, nucleusBrightness: 0.08, ringVibration: 0.15 }),
    hub: Object.freeze({ wheelScale: 1.005, spokeGlow: 0.16, nodeMotion: "shift" }),
    voidField: Object.freeze({ shimmer: 0.08, particleMotion: "rise" }),
    fieldFrame: Object.freeze({ glow: 0.02, ripple: "top" }),
    engineCore: Object.freeze({ pressure: 0.12, resonance: "life" }),
    logo: Object.freeze({ pulse: 0.08, distortion: 0 }),
    orbitNodes: Object.freeze({ motion: "shift", freezeMs: 0, acceleration: 1.04 }),
    revealEngine: Object.freeze({ timing: "awake" }),
    descentEngine: Object.freeze({ timing: "awake" })
  }),
  heartbeat: Object.freeze({
    durationMs: 1100,
    intensity: 1,
    primeAtom: Object.freeze({ electronExpansion: 0.05, nucleusBrightness: 0.55, ringVibration: 1 }),
    hub: Object.freeze({ wheelScale: 0.975, spokeGlow: 0.82, nodeMotion: "freeze-accelerate" }),
    voidField: Object.freeze({ shimmer: 0.28, particleMotion: "scatter-settle" }),
    fieldFrame: Object.freeze({ glow: 0.22, ripple: "perimeter" }),
    engineCore: Object.freeze({ pressure: 0.78, resonance: "chamber" }),
    logo: Object.freeze({ pulse: 0.42, distortion: 0.08 }),
    orbitNodes: Object.freeze({ motion: "freeze-accelerate", freezeMs: 200, acceleration: 1.75 }),
    revealEngine: Object.freeze({ timing: "sync" }),
    descentEngine: Object.freeze({ timing: "sync" })
  }),
  flicker: Object.freeze({
    durationMs: 520,
    intensity: 1.25,
    primeAtom: Object.freeze({ electronExpansion: 0, nucleusBrightness: 0.72, ringVibration: 0.65 }),
    hub: Object.freeze({ wheelScale: 1, spokeGlow: 1, nodeMotion: "jitter" }),
    voidField: Object.freeze({ shimmer: -0.24, particleMotion: "reverse" }),
    fieldFrame: Object.freeze({ glow: 0.38, ripple: "veins" }),
    engineCore: Object.freeze({ pressure: 1, resonance: "harmonic" }),
    logo: Object.freeze({ pulse: 0.3, distortion: 0.18 }),
    orbitNodes: Object.freeze({ motion: "jitter", freezeMs: 100, acceleration: -1 }),
    revealEngine: Object.freeze({ timing: "anomaly" }),
    descentEngine: Object.freeze({ timing: "anomaly" })
  })
});

function flickerDelay(random) {
  return FLICKER_MIN_MS + random() * (FLICKER_MAX_MS - FLICKER_MIN_MS);
}

export function createHeartbeatClock({ startedAt = 0, random = Math.random } = {}) {
  return {
    sequence: 0,
    nextMicroAt: startedAt + MICRO_PULSE_MS,
    nextPrimaryAt: startedAt + PRIMARY_HEARTBEAT_MS,
    nextFlickerAt: startedAt + flickerDelay(random)
  };
}

function fieldEvent(clock, phase, occurredAt) {
  clock.sequence += 1;
  const effects = HEARTBEAT_PHASES[phase];
  return {
    id: `engine-heartbeat-${clock.sequence}`,
    phase,
    occurredAt,
    durationMs: effects.durationMs,
    intensity: effects.intensity,
    effects
  };
}

export function advanceHeartbeatClock(clock, now, random = Math.random) {
  const events = [];
  while (clock.nextMicroAt <= now) {
    events.push(fieldEvent(clock, "micro-pulse", clock.nextMicroAt));
    clock.nextMicroAt += MICRO_PULSE_MS;
  }
  while (clock.nextPrimaryAt <= now) {
    events.push(fieldEvent(clock, "heartbeat", clock.nextPrimaryAt));
    clock.nextPrimaryAt += PRIMARY_HEARTBEAT_MS;
  }
  while (clock.nextFlickerAt <= now) {
    const occurredAt = clock.nextFlickerAt;
    events.push(fieldEvent(clock, "flicker", occurredAt));
    clock.nextFlickerAt = occurredAt + flickerDelay(random);
  }
  return events.sort((left, right) => left.occurredAt - right.occurredAt || left.intensity - right.intensity);
}

export function heartbeatEnvelope(event, now) {
  if (!event) return 0;
  const progress = (now - event.occurredAt) / event.durationMs;
  if (progress < 0 || progress > 1) return 0;
  return Math.sin(progress * Math.PI);
}