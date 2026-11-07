const CYCLE_PHASES = Object.freeze(["Coherence", "Tension", "Collapse", "Void", "Renewal"]);
const SEASON_STATES = Object.freeze(["Winter", "Spring", "Summer", "Autumn"]);

const CYCLE_SIGNATURES = Object.freeze({
  Coherence: Object.freeze({
    glyph: "Circle",
    drift: "inward-gathering",
    pressure: "warm-even",
    resonance: "harmonic",
    cues: Object.freeze(["warm-steady-air", "low-contrast-light", "radial-growth"])
  }),
  Tension: Object.freeze({
    glyph: "Gate",
    drift: "linear-compression",
    pressure: "vertical-stacking",
    resonance: "sharp-directional",
    cues: Object.freeze(["sharp-dry-air", "wind-funnels", "high-contrast-light"])
  }),
  Collapse: Object.freeze({
    glyph: "Crown",
    drift: "scattering-outward",
    pressure: "outward-bursts",
    resonance: "diffuse-unstable",
    cues: Object.freeze(["erratic-air", "fracturing-paths", "sudden-temperature-drops"])
  }),
  Void: Object.freeze({
    glyph: "Tree",
    drift: "downward-settling",
    pressure: "low-even",
    resonance: "muted",
    cues: Object.freeze(["still-air", "low-even-light", "dormant-flora"])
  }),
  Renewal: Object.freeze({
    glyph: "Lantern",
    drift: "upward-rising",
    pressure: "warm-expanding",
    resonance: "flickering",
    cues: Object.freeze(["warm-pockets", "rising-light", "early-growth"])
  })
});

const SEASON_SIGNATURES = Object.freeze({
  Winter: Object.freeze({
    drift: "near-zero",
    density: "compressed",
    emotionalTone: "quiet",
    memory: "intertwined",
    cues: Object.freeze(["cool-stillness", "low-amplitude-weather"])
  }),
  Spring: Object.freeze({
    drift: "outward",
    density: "rising",
    emotionalTone: "porous",
    memory: "sorting",
    cues: Object.freeze(["gentle-turbulence", "emergent-weather"])
  }),
  Summer: Object.freeze({
    drift: "accelerated",
    density: "peak-saturation",
    emotionalTone: "volatile",
    memory: "passive-dense",
    cues: Object.freeze(["high-pressure-weather", "storms-possible"])
  }),
  Autumn: Object.freeze({
    drift: "inward",
    density: "falling",
    emotionalTone: "stabilizing",
    memory: "active",
    cues: Object.freeze(["unwinding-weather", "softening-fronts"])
  })
});

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function requireFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function normalizeResonance(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new TypeError("drivers.resonance spectrum must not be empty");
    }
    return Object.freeze(value.map((sample, index) =>
      requireFiniteNumber(sample, `drivers.resonance[${index}]`)
    ));
  }
  return requireFiniteNumber(value, "drivers.resonance");
}

function normalizePhenomenon(value, name) {
  if (value === null) {
    return null;
  }
  return requireNonEmptyString(value, name);
}

export function createWeatherSnapshot({
  nodeId,
  cyclePhase,
  seasonState,
  drivers,
  phenomena
} = {}) {
  const id = requireNonEmptyString(nodeId, "nodeId");
  if (!CYCLE_PHASES.includes(cyclePhase)) {
    throw new TypeError(`cyclePhase must be one of: ${CYCLE_PHASES.join(", ")}`);
  }
  if (!SEASON_STATES.includes(seasonState)) {
    throw new TypeError(`seasonState must be one of: ${SEASON_STATES.join(", ")}`);
  }
  if (!drivers || typeof drivers !== "object" || Array.isArray(drivers)) {
    throw new TypeError("drivers must be an object");
  }
  if (!Array.isArray(drivers.drift) || drivers.drift.length === 0) {
    throw new TypeError("drivers.drift must be a non-empty numeric vector");
  }
  const normalizedDrift = Object.freeze(drivers.drift.map((component, index) =>
    requireFiniteNumber(component, `drivers.drift[${index}]`)
  ));
  const normalizedDrivers = Object.freeze({
    drift: normalizedDrift,
    pressure: requireFiniteNumber(drivers.pressure, "drivers.pressure"),
    resonance: normalizeResonance(drivers.resonance),
    density: requireFiniteNumber(drivers.density, "drivers.density")
  });

  if (!phenomena || typeof phenomena !== "object" || Array.isArray(phenomena)) {
    throw new TypeError("phenomena must provide symbolic and astral values");
  }
  const normalizedPhenomena = Object.freeze({
    environmental: normalizePhenomenon(phenomena.environmental, "phenomena.environmental"),
    symbolic: normalizePhenomenon(phenomena.symbolic, "phenomena.symbolic"),
    astral: normalizePhenomenon(phenomena.astral, "phenomena.astral")
  });

  return Object.freeze({
    nodeId: id,
    cyclePhase,
    seasonState,
    drivers: normalizedDrivers,
    signatures: Object.freeze({
      cycle: CYCLE_SIGNATURES[cyclePhase],
      season: SEASON_SIGNATURES[seasonState]
    }),
    phenomena: normalizedPhenomena,
    scope: Object.freeze({ kind: "local", id })
  });
}

export const THRESHOLD_WEATHER_CYCLE_PHASES = CYCLE_PHASES;
export const THRESHOLD_WEATHER_SEASONS = SEASON_STATES;
