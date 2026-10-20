const EPSILON = 1e-6;
const DIRECTION_VALUES = new Set([-1, 0, 1]);
const SYSTEM_STATES = Object.freeze([
  "Disjoint",
  "LocalResonance",
  "DistributedPressure",
  "GlobalDrift",
  "Harmony",
  "Fragmented"
]);

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function normalizePattern(value, name) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty array of feature strings`);
  }

  const features = value.map((feature) => requireNonEmptyString(feature, name));
  if (new Set(features).size !== features.length) {
    throw new TypeError(`${name} must not contain duplicate features`);
  }
  return Object.freeze(features);
}

function normalizeSignal(signal) {
  if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
    throw new TypeError("Echo signal must be an object");
  }

  const pattern = normalizePattern(signal.pattern, "signal.pattern");
  const charge = Number(signal.charge);
  const frequency = Number(signal.frequency);
  const direction = Number(signal.direction);
  if (!Number.isFinite(charge) || charge < 0) {
    throw new TypeError("signal.charge must be a finite non-negative number");
  }
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new TypeError("signal.frequency must be a finite positive number");
  }
  if (!DIRECTION_VALUES.has(direction)) {
    throw new TypeError("signal.direction must be -1, 0, or 1");
  }
  if (!Array.isArray(signal.boundary) || signal.boundary.length === 0) {
    throw new TypeError("signal.boundary must list at least one permitted node id");
  }

  const boundary = Object.freeze(
    [...new Set(signal.boundary.map((nodeId) => requireNonEmptyString(nodeId, "signal.boundary")))]
  );

  return Object.freeze({
    pattern,
    charge,
    frequency,
    direction,
    boundary
  });
}

function cloneAnchor(anchorState) {
  if (!anchorState) {
    return null;
  }
  return Object.freeze({
    pattern: Object.freeze([...anchorState.pattern]),
    position: anchorState.position,
    boundary: anchorState.boundary
  });
}

function patternsMatch(left, right) {
  return left.length === right.length
    && left.every((feature) => right.includes(feature));
}

function patternsOverlap(left, right) {
  return left.some((feature) => right.includes(feature));
}

export class EchoNode {
  constructor({
    id,
    pattern,
    boundary,
    frequencyBand,
    toleranceBand,
    flexibility,
    stability,
    reconfigure
  }) {
    this.id = requireNonEmptyString(id, "node.id");
    this.pattern = normalizePattern(pattern, "node.pattern");
    this.boundary = requireNonEmptyString(boundary, "node.boundary");

    if (!Array.isArray(frequencyBand) || frequencyBand.length !== 2
      || !frequencyBand.every(Number.isFinite)
      || frequencyBand[0] <= 0
      || frequencyBand[0] > frequencyBand[1]) {
      throw new TypeError("node.frequencyBand must be an ordered positive [minimum, maximum] pair");
    }
    if (!Number.isFinite(toleranceBand) || toleranceBand <= 0) {
      throw new TypeError("node.toleranceBand must be a finite positive number");
    }
    if (!Number.isFinite(flexibility) || flexibility <= 0 || flexibility > 1) {
      throw new TypeError("node.flexibility must be greater than 0 and at most 1");
    }
    if (!Number.isFinite(stability) || stability <= 0) {
      throw new TypeError("node.stability must be a finite positive number");
    }
    if (typeof reconfigure !== "function") {
      throw new TypeError("node.reconfigure must be a function");
    }

    this.frequencyBand = Object.freeze([...frequencyBand]);
    this.toleranceBand = toleranceBand;
    this.flexibility = flexibility;
    this.stability = stability;
    this.collapseThreshold = toleranceBand * stability;
    this.reconfigure = reconfigure;

    this.phase = "Idle";
    this.position = 0;
    this.resonanceStrength = 0;
    this.pressure = 0;
    this.driftVector = 0;
    this.signalCount = 0;
    this.history = [];
    this.activeSignal = null;
    this.anchorState = cloneAnchor({
      pattern: this.pattern,
      position: this.position,
      boundary: this.boundary
    });
  }

  receiveSignal(input) {
    if (this.phase === "Inert") {
      throw new Error(`Echo node "${this.id}" is inert and cannot receive signals`);
    }
    if (this.phase !== "Idle" && this.phase !== "Anchored") {
      throw new Error(`Echo node "${this.id}" cannot receive a signal while ${this.phase}`);
    }
    const signal = normalizeSignal(input);
    const transitions = [];

    const boundaryAllowed = signal.boundary.includes(this.id);
    const frequencyAllowed = signal.frequency >= this.frequencyBand[0]
      && signal.frequency <= this.frequencyBand[1];
    const matchedFeatures = boundaryAllowed && frequencyAllowed
      ? signal.pattern.filter((feature) => this.pattern.includes(feature)).length
      : 0;

    const resonanceStrength = matchedFeatures / signal.pattern.length;
    const pressure = (1 - resonanceStrength) * signal.charge;

    if (resonanceStrength > 0 && pressure > EPSILON && signal.direction === 0) {
      throw new TypeError("signal.direction must be non-zero when a partial match creates pressure");
    }

    this._transition("SignalReceived", transitions);
    if (resonanceStrength === 0) {
      const reason = !boundaryAllowed
        ? "boundary-rejected"
        : !frequencyAllowed
          ? "frequency-rejected"
          : "no-resonance";
      this.resonanceStrength = 0;
      this.pressure = 0;
      this.driftVector = 0;
      this.activeSignal = null;
      this._transition("Idle", transitions);
      return this.snapshot({
        accepted: false,
        reason,
        transitions
      });
    }

    this.resonanceStrength = resonanceStrength;
    this.pressure = pressure;
    this.driftVector = pressure * this.flexibility * signal.direction;
    this.signalCount += 1;
    this.activeSignal = signal;
    this.history.push(Object.freeze({
      pattern: signal.pattern,
      frequency: signal.frequency,
      resonanceStrength: this.resonanceStrength
    }));

    if (this.resonanceStrength === 1) {
      this._transition("Resonating", transitions);
      this._anchor(signal.pattern, transitions);
      return this.snapshot({ accepted: true, transitions });
    }

    this._transition("UnderPressure", transitions);
    if (this.pressure >= this.collapseThreshold) {
      return this._collapse(signal, transitions);
    }

    this._transition("Drifting", transitions);
    this._applyDriftStep(transitions);
    return this.snapshot({ accepted: true, transitions });
  }

  advance() {
    if (this.phase !== "Drifting" || !this.activeSignal) {
      throw new Error(`Echo node "${this.id}" can only advance while Drifting`);
    }

    const transitions = [];
    this._applyDriftStep(transitions);
    return this.snapshot({ accepted: true, transitions });
  }

  snapshot(extra = {}) {
    return Object.freeze({
      id: this.id,
      phase: this.phase,
      pattern: Object.freeze([...this.pattern]),
      boundary: this.boundary,
      frequencyBand: this.frequencyBand,
      toleranceBand: this.toleranceBand,
      flexibility: this.flexibility,
      stability: this.stability,
      collapseThreshold: this.collapseThreshold,
      position: this.position,
      resonanceStrength: this.resonanceStrength,
      pressure: this.pressure,
      driftVector: this.driftVector,
      signalCount: this.signalCount,
      anchorState: cloneAnchor(this.anchorState),
      history: Object.freeze([...this.history]),
      ...extra,
      transitions: Object.freeze([...(extra.transitions || [])])
    });
  }

  _transition(phase, transitions) {
    this.phase = phase;
    transitions.push(phase);
  }

  _anchor(pattern, transitions) {
    this.pattern = Object.freeze([...pattern]);
    this.pressure = 0;
    this.driftVector = 0;
    this.activeSignal = null;
    this.anchorState = cloneAnchor({
      pattern: this.pattern,
      position: this.position,
      boundary: this.boundary
    });
    this._transition("Anchored", transitions);
  }

  _applyDriftStep(transitions) {
    if (this.pressure <= EPSILON) {
      this._anchor(this.activeSignal.pattern, transitions);
      return;
    }

    const step = this.pressure * this.flexibility * this.activeSignal.direction;
    this.position += step;
    this.pressure = Math.max(0, this.pressure - Math.abs(step));
    this.driftVector = this.pressure > EPSILON
      ? this.pressure * this.flexibility * this.activeSignal.direction
      : 0;

    if (this.pressure <= EPSILON) {
      this._anchor(this.activeSignal.pattern, transitions);
    }
  }

  _collapse(signal, transitions) {
    this._transition("Collapsing", transitions);
    this.history = [];
    this.anchorState = null;
    this.position = 0;
    this.driftVector = 0;

    let reconfigured;
    try {
      reconfigured = this.reconfigure({
        signal,
        node: this.snapshot()
      });
    } catch (error) {
      this.pressure = 0;
      this.activeSignal = null;
      this._transition("Inert", transitions);
      throw error;
    }
    if (typeof reconfigured !== "boolean") {
      this.pressure = 0;
      this.activeSignal = null;
      this._transition("Inert", transitions);
      throw new TypeError(`Echo node "${this.id}" reconfigure callback must return a boolean`);
    }
    if (!reconfigured) {
      this.pressure = 0;
      this.activeSignal = null;
      this._transition("Inert", transitions);
      return this.snapshot({ accepted: true, transitions });
    }

    this._anchor(signal.pattern, transitions);
    return this.snapshot({ accepted: true, transitions });
  }
}

export function resolveEchoSystem(nodes) {
  if (!Array.isArray(nodes) || nodes.some((node) => !(node instanceof EchoNode))) {
    throw new TypeError("Echo system requires an array of EchoNode instances");
  }

  const activeNodes = nodes.filter((node) => node.signalCount > 0);
  const pressure = activeNodes.reduce((total, node) => total + node.pressure, 0);
  const driftVector = activeNodes.reduce((total, node) => total + node.driftVector, 0);
  const pressureThreshold = activeNodes.length
    ? Math.min(...activeNodes.map((node) => node.collapseThreshold))
    : 0;

  let state = "Disjoint";
  let harmonyMode = null;
  if (activeNodes.some((node) => node.phase === "Inert")) {
    state = "Fragmented";
  } else if (activeNodes.length) {
    if (pressure >= pressureThreshold && pressure > EPSILON) {
      state = "DistributedPressure";
    } else if (Math.abs(driftVector) > EPSILON) {
      state = "GlobalDrift";
    } else if (activeNodes.length >= 2
      && activeNodes.every((node) => node.phase === "Anchored")) {
      const anchorPatterns = activeNodes.map((node) => node.anchorState.pattern);
      const resonant = anchorPatterns.every((pattern) => patternsMatch(pattern, anchorPatterns[0]));
      const complementary = !resonant && anchorPatterns.every((pattern, index) =>
        anchorPatterns.slice(index + 1).every((other) => patternsOverlap(pattern, other))
      );
      if (resonant || complementary) {
        state = "Harmony";
        harmonyMode = resonant ? "resonant" : "complementary";
      } else {
        state = "Fragmented";
      }
    } else {
      state = "LocalResonance";
    }
  }

  return Object.freeze({
    state,
    harmonyMode,
    activeNodeIds: Object.freeze(activeNodes.map((node) => node.id)),
    pressure,
    pressureThreshold,
    driftVector
  });
}

export class EchoProtocolLens {
  inspect(nodes) {
    const system = resolveEchoSystem(nodes);
    const nodeSnapshots = nodes.map((node) => node.snapshot());
    return Object.freeze({
      system,
      nodes: Object.freeze(nodeSnapshots),
      metrics: Object.freeze({
        activeNodeCount: system.activeNodeIds.length,
        anchoredNodeCount: nodeSnapshots.filter((node) => node.phase === "Anchored").length,
        totalSignals: nodeSnapshots.reduce((total, node) => total + node.signalCount, 0),
        resonanceStrength: Object.freeze(nodeSnapshots.map(({ id, resonanceStrength }) =>
          Object.freeze({ id, value: resonanceStrength })
        )),
        pressure: Object.freeze(nodeSnapshots.map(({ id, pressure }) =>
          Object.freeze({ id, value: pressure })
        )),
        driftVector: Object.freeze(nodeSnapshots.map(({ id, driftVector }) =>
          Object.freeze({ id, value: driftVector })
        ))
      })
    });
  }
}

export const ECHO_SYSTEM_STATES = SYSTEM_STATES;
