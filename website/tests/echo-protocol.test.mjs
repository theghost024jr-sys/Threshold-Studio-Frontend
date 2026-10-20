import assert from "node:assert/strict";
import test from "node:test";
import { EchoNode, EchoProtocolLens, resolveEchoSystem } from "../echo-protocol.js";

function createNode(id, overrides = {}) {
  return new EchoNode({
    id,
    pattern: ["branch", id],
    boundary: "threshold-branch",
    frequencyBand: [0.5, 2],
    toleranceBand: 1,
    flexibility: 0.1,
    stability: 4,
    reconfigure: () => true,
    ...overrides
  });
}

function sendSignal(node, overrides = {}) {
  return node.receiveSignal({
    pattern: node.pattern,
    charge: 1,
    frequency: 1,
    direction: 0,
    boundary: [node.id],
    ...overrides
  });
}

test("accepts exact resonance and anchors the node", () => {
  const node = createNode("home");
  assert.equal(node.substrateState, "Argon");
  assert.equal(node.anchorState, null);
  const result = sendSignal(node);

  assert.equal(result.accepted, true);
  assert.equal(result.substrateState, "Echo");
  assert.equal(result.phase, "Anchored");
  assert.equal(result.resonanceStrength, 1);
  assert.equal(result.pressure, 0);
  assert.equal(result.driftVector, 0);
  assert.deepEqual(result.anchorState.pattern, ["branch", "home"]);
});

test("partial resonance creates pressure and drift that reduce on advance", () => {
  const node = createNode("home");
  const first = node.receiveSignal({
    pattern: ["branch", "other"],
    charge: 1,
    frequency: 1,
    direction: 1,
    boundary: ["home"]
  });

  assert.equal(first.resonanceStrength, 0.5);
  assert.equal(first.phase, "Drifting");
  assert.equal(first.pressure, 0.45);
  assert.equal(first.position, 0.05);

  const next = node.advance();
  assert.equal(next.phase, "Drifting");
  assert.ok(next.pressure < first.pressure);
  assert.ok(next.position > first.position);
});

test("rejects invalid direction before changing node state", () => {
  const node = createNode("home");
  assert.throws(() => node.receiveSignal({
    pattern: ["branch", "other"],
    charge: 1,
    frequency: 1,
    direction: 0,
    boundary: ["home"]
  }), /direction must be non-zero/);
  assert.equal(node.phase, "Idle");
  assert.equal(node.signalCount, 0);
  assert.equal(node.pressure, 0);
  assert.equal(node.history.length, 0);
});

test("rejects out-of-boundary and out-of-frequency signals with explicit reasons", () => {
  const node = createNode("home");
  const boundaryResult = sendSignal(node, { boundary: ["other"] });
  assert.equal(boundaryResult.accepted, false);
  assert.equal(boundaryResult.reason, "boundary-rejected");

  const frequencyResult = sendSignal(node, { frequency: 3 });
  assert.equal(frequencyResult.accepted, false);
  assert.equal(frequencyResult.reason, "frequency-rejected");
  assert.equal(node.phase, "Idle");
});

test("collapse clears history and anchors after successful reconfiguration", () => {
  const node = createNode("home", {
    toleranceBand: 1,
    stability: 1,
    reconfigure: () => true
  });
  const result = node.receiveSignal({
    pattern: ["branch", "other"],
    charge: 4,
    frequency: 1,
    direction: 1,
    boundary: ["home"]
  });

  assert.deepEqual(result.transitions, ["SignalReceived", "UnderPressure", "Collapsing", "Anchored"]);
  assert.equal(result.phase, "Anchored");
  assert.equal(result.history.length, 0);
  assert.deepEqual(result.anchorState.pattern, ["branch", "other"]);
});

test("failed or invalid reconfiguration leaves the node inert", () => {
  const cases = [
    { reconfigure: () => false, throws: false },
    { reconfigure: () => undefined, throws: /must return a boolean/ },
    { reconfigure: () => { throw new Error("reconfigure failed"); }, throws: /reconfigure failed/ }
  ];
  for (const { reconfigure, throws } of cases) {
    const node = createNode("home", {
      toleranceBand: 1,
      stability: 1,
      reconfigure
    });
    const input = {
      pattern: ["branch", "other"],
      charge: 4,
      frequency: 1,
      direction: 1,
      boundary: ["home"]
    };

    if (throws) {
      assert.throws(() => node.receiveSignal(input), throws);
    } else {
      const result = node.receiveSignal(input);
      assert.equal(result.phase, "Inert");
    }
    assert.equal(node.phase, "Inert");
    assert.equal(node.anchorState, null);
  }
});

test("resets Echo state and adapted pattern back to the inert Argon substrate", () => {
  const node = createNode("home", { toleranceBand: 1, stability: 1 });
  sendSignal(node, { pattern: ["branch", "other"], charge: 4, direction: 1 });
  assert.equal(node.substrateState, "Echo");
  assert.deepEqual(node.pattern, ["branch", "other"]);

  const reset = node.reset();

  assert.equal(reset.substrateState, "Argon");
  assert.equal(reset.phase, "Idle");
  assert.deepEqual(reset.pattern, ["branch", "home"]);
  assert.equal(reset.resonanceStrength, 0);
  assert.equal(reset.pressure, 0);
  assert.equal(reset.driftVector, 0);
  assert.equal(reset.signalCount, 0);
  assert.equal(reset.anchorState, null);
  assert.equal(reset.history.length, 0);
});

test("resolves matching and complementary anchors as distinct Harmony modes", () => {
  const resonant = [
    createNode("one", { pattern: ["shared", "same"] }),
    createNode("two", { pattern: ["shared", "same"] })
  ];
  resonant.forEach((node) => sendSignal(node, { pattern: ["shared", "same"] }));
  const resonantSystem = resolveEchoSystem(resonant);
  assert.equal(resonantSystem.state, "Harmony");
  assert.equal(resonantSystem.harmonyMode, "resonant");

  const complementary = [
    createNode("north", { pattern: ["shared", "north"] }),
    createNode("south", { pattern: ["shared", "south"] })
  ];
  complementary.forEach((node) => sendSignal(node));
  const complementarySystem = resolveEchoSystem(complementary);
  assert.equal(complementarySystem.state, "Harmony");
  assert.equal(complementarySystem.harmonyMode, "complementary");
});

test("conflicting anchors fragment the system", () => {
  const nodes = [
    createNode("north", { pattern: ["north"] }),
    createNode("south", { pattern: ["south"] })
  ];
  nodes.forEach((node) => sendSignal(node));

  const system = resolveEchoSystem(nodes);
  assert.equal(system.state, "Fragmented");
  assert.equal(system.harmonyMode, null);
});

test("Echo Protocol Lens reports telemetry without mutating nodes", () => {
  const nodes = [createNode("home"), createNode("ethos")];
  sendSignal(nodes[0]);
  const before = nodes.map((node) => node.snapshot());
  const report = new EchoProtocolLens().inspect(nodes);

  assert.equal(report.system.state, "LocalResonance");
  assert.equal(report.metrics.activeNodeCount, 1);
  assert.equal(report.metrics.anchoredNodeCount, 1);
  assert.equal(report.metrics.totalSignals, 1);
  assert.deepEqual(nodes.map((node) => node.snapshot()), before);
  assert.ok(Object.isFrozen(report));
  assert.ok(Object.isFrozen(report.nodes));
});

test("resolves only nodes that received Echo and leaves other nodes in Argon", () => {
  const nodes = [createNode("one"), createNode("two")];
  sendSignal(nodes[0]);

  const system = resolveEchoSystem(nodes);

  assert.deepEqual(system.activeNodeIds, ["one"]);
  assert.equal(nodes[0].substrateState, "Echo");
  assert.equal(nodes[1].substrateState, "Argon");
  assert.equal(nodes[1].signalCount, 0);
  assert.equal(nodes[1].anchorState, null);
});
