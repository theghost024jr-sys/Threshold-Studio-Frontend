const FIBONACCI_SEQUENCE = Object.freeze([13, 8, 5, 3, 2, 1]);

function assertSequence(config) {
  const sequence = config && config.sequence;
  if (!Array.isArray(sequence) || sequence.length !== FIBONACCI_SEQUENCE.length
    || sequence.some((fib, index) => fib !== FIBONACCI_SEQUENCE[index])) {
    throw new Error("Fibonacci route sequence must be 13, 8, 5, 3, 2, 1");
  }
}

function uniqueStrings(values, label) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(label + " must contain at least one value");
  }
  const normalized = values.map((value) => String(value));
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(label + " must not contain duplicates");
  }
  return normalized;
}

function assertStateKeys(values, fields) {
  const unknown = Object.keys(values).filter((key) => !fields.includes(key));
  if (unknown.length) {
    throw new Error("Level state contains undeclared fields: " + unknown.join(", "));
  }
}

function freezeLevel(level) {
  return Object.freeze({
    ...level,
    versions: Object.freeze([...level.versions]),
    fields: Object.freeze([...level.fields]),
    required: Object.freeze([...level.required]),
    pass: Object.freeze([...level.pass]),
    state: Object.freeze({ ...level.state })
  });
}

export function resolveFibonacciRoute(config, spokeId, pathId) {
  assertSequence(config);
  const spoke = config.spokes && config.spokes[spokeId];
  if (!spoke) {
    throw new Error("Unknown Fibonacci spoke: " + spokeId);
  }
  const route = (spoke.routes || []).find((candidate) => candidate.id === pathId);
  if (!route) {
    throw new Error("Unknown path for " + spokeId + ": " + pathId);
  }
  if (route.targetFib >= spoke.entryFib) {
    throw new Error("Fibonacci routes must move inward");
  }
  return Object.freeze({
    spoke: spokeId,
    path: route.id,
    label: route.label,
    version: route.version,
    fromFib: spoke.entryFib,
    fib: route.targetFib
  });
}

export function buildFibonacciUrl(lineage, baseUrl = "spoke.html") {
  const params = new URLSearchParams({
    id: lineage.spoke,
    path: lineage.path,
    version: lineage.version,
    fib: String(lineage.fib)
  });
  return baseUrl + "?" + params.toString();
}

export function readFibonacciLineage(search) {
  const params = new URLSearchParams(search);
  const fib = Number(params.get("fib"));
  if (!params.get("id") || !params.get("path") || !params.get("version")
    || !FIBONACCI_SEQUENCE.includes(fib)) {
    return null;
  }
  return Object.freeze({
    spoke: params.get("id"),
    path: params.get("path"),
    version: params.get("version"),
    fib
  });
}

export function nextFibonacciFib(fib) {
  const index = FIBONACCI_SEQUENCE.indexOf(Number(fib));
  return index >= 0 && index < FIBONACCI_SEQUENCE.length - 1
    ? FIBONACCI_SEQUENCE[index + 1]
    : FIBONACCI_SEQUENCE[FIBONACCI_SEQUENCE.length - 1];
}

export function createLevelState(options) {
  const fib = Number(options && options.fib);
  if (!FIBONACCI_SEQUENCE.includes(fib)) {
    throw new Error("Unknown Fibonacci level: " + fib);
  }
  const versions = uniqueStrings(options.versions, "Level versions");
  const fields = uniqueStrings(options.fields, "Level fields");
  const required = (options.required || []).map(String);
  const pass = (options.pass || []).map(String);
  if (!fields.includes("version") || required.some((key) => !fields.includes(key))
    || pass.some((key) => !fields.includes(key))) {
    throw new Error("Level fields must declare version, required, and pass keys");
  }
  const version = String(options.version || versions[0]);
  if (!versions.includes(version)) {
    throw new Error("Version is not valid for Fib " + fib + ": " + version);
  }
  const state = { ...(options.state || {}), version };
  assertStateKeys(state, fields);
  return freezeLevel({
    fib,
    versions,
    fields,
    required,
    pass,
    state,
    rotation: 0,
    crowned: false
  });
}

export function updateLevelState(level, values) {
  assertStateKeys(values, level.fields);
  const state = { ...level.state, ...values };
  if (!level.versions.includes(String(state.version))) {
    throw new Error("Version is not valid for Fib " + level.fib + ": " + state.version);
  }
  return freezeLevel({ ...level, state, crowned: false });
}

export function rotateLevel(level) {
  const current = level.versions.indexOf(level.state.version);
  const version = level.versions[(current + 1) % level.versions.length];
  return freezeLevel({
    ...level,
    state: { version },
    rotation: level.rotation + 1,
    crowned: false
  });
}

export function crownLevel(level) {
  const missing = level.required.filter((key) => {
    const value = level.state[key];
    return value === undefined || value === null || value === "";
  });
  if (missing.length) {
    throw new Error("Fib " + level.fib + " is incomplete: " + missing.join(", "));
  }
  return freezeLevel({ ...level, crowned: true });
}

export function createThresholdPass(level) {
  if (!level.crowned) {
    throw new Error("Fib " + level.fib + " must crown before it can pass");
  }
  if (level.fib === 1) {
    throw new Error("Fib 1 is the core and cannot pass inward");
  }
  const state = {};
  level.pass.forEach((key) => {
    state[key] = level.state[key];
  });
  return Object.freeze({
    fromFib: level.fib,
    toFib: nextFibonacciFib(level.fib),
    state: Object.freeze(state)
  });
}

export function canShimmer(level) {
  return level.crowned === true && level.state.shimmer === true;
}

export { FIBONACCI_SEQUENCE };