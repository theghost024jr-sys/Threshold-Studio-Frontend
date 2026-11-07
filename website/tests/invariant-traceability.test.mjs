import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import {
  summarizeStatus,
  traceabilityReport,
  validateEnforcement,
  validateLifecycleAndEnforcement
} from "../scripts/invariant-traceability-report.js";
import { validateTraceabilityRegistry } from "../scripts/validate-invariant-traceability.mjs";
import { selectActivationCandidates } from "../scripts/validate-invariant-traceability.mjs";

const root = new URL("../", import.meta.url);
const traceability = await readFile(
  new URL("config/invariant-traceability.json", root),
  "utf8"
).then(JSON.parse);
const requirementSchema = await readFile(
  new URL("config/threshold-requirement.schema.json", root),
  "utf8"
).then(JSON.parse);

function ids(items) {
  return new Set(items.map((item) => item.id));
}

function requireUnique(items, label) {
  assert.equal(ids(items).size, items.length, `${label} IDs must be unique`);
}

test("keeps stable architecture, invariant, and requirement ID allocation distinct", () => {
  assert.doesNotThrow(() => validateTraceabilityRegistry(traceability));
  assert.equal(traceability.idPolicy.stableAcrossRenames, true);
  assert.equal(traceability.idPolicy.retiredIdsMayNotBeReused, true);
  requireUnique(traceability.principles, "Architecture principle");
  requireUnique(traceability.kernelInvariants, "Kernel invariant");
  requireUnique(traceability.domainInvariants, "Domain invariant");
  requireUnique(traceability.requirements, "Active requirement");
  requireUnique(traceability.tests, "Active test");
  requireUnique(traceability.gates, "Gate");
  requireUnique(traceability.fullLoops, "Full-loop");

  assert.deepEqual(traceability.requirementIdAllocation, {
    start: "REQ-001",
    end: "REQ-145"
  });
  for (const requirement of traceability.requirements) {
    assert.match(requirement.id, /^REQ-\d{3}$/);
    assert.ok(requirement.title);
    assert.ok(requirement.statement);
    assert.ok(requirement.parentInvariantIds.length > 0);
    assert.ok(Array.isArray(requirement.predecessorRequirementIds));
    assert.ok(Array.isArray(requirement.enforcingGateIds));
    assert.ok(Array.isArray(requirement.supersedesRequirementIds));
    assert.ok(Array.isArray(requirement.supersededByRequirementIds));
  }
});

test("publishes the canonical materialized-requirement schema", () => {
  assert.equal(requirementSchema.$id, "https://threshold.local/schemas/requirement.schema.json");
  assert.equal(requirementSchema.additionalProperties, false);
  assert.deepEqual(requirementSchema.required, [
    "id",
    "title",
    "statement",
    "priority",
    "parentInvariantIds",
    "predecessorRequirementIds",
    "lifecycle",
    "enforcement",
    "testIds",
    "enforcingGateIds",
    "supersedesRequirementIds",
    "supersededByRequirementIds"
  ]);
});

test("maps every active contract to its invariant, executable test, and source annotation", async () => {
  const invariantIds = ids(traceability.domainInvariants);
  const testsById = new Map(traceability.tests.map((item) => [item.id, item]));

  for (const requirement of traceability.requirements) {
    assert.equal(requirement.lifecycle, "active");
    assert.equal(requirement.enforcement, "observed");
    const parentInvariantIds = requirement.parentInvariantIds;
    assert.ok(parentInvariantIds.length > 0);
    assert.ok(requirement.testIds.length > 0);
    for (const invariantId of parentInvariantIds) {
      assert.ok(invariantIds.has(invariantId), `${requirement.id} must map to an invariant`);
    }
    for (const testId of requirement.testIds) {
      assert.ok(testsById.has(testId), `${requirement.id} must map to an active test`);
    }
  }

  for (const contractTest of traceability.tests) {
    const repositoryRoot = new URL("../", root);
    await access(new URL(contractTest.source, repositoryRoot));
    const source = await readFile(new URL(contractTest.source, repositoryRoot), "utf8");
    assert.match(source, new RegExp(`\\[${contractTest.id}\\]`));
    assert.equal(contractTest.lifecycle, "active");
    assert.equal(contractTest.enforcement, "observed");
    assert.ok(contractTest.requirementIds.length > 0);
    for (const requirementId of contractTest.requirementIds) {
      const requirement = traceability.requirements.find((item) => item.id === requirementId);
      assert.ok(requirement, `${contractTest.id} references an active requirement`);
      assert.ok(requirement.testIds.includes(contractTest.id));
    }
  }
});

test("keeps the planned pipeline acyclic without claiming it is active CI enforcement", () => {
  const gates = new Map(traceability.gates.map((gate) => [gate.id, gate]));
  const visiting = new Set();
  const visited = new Set();

  function visit(gateId) {
    assert.ok(gates.has(gateId), `Unknown gate ${gateId}`);
    assert.ok(!visiting.has(gateId), `Pipeline cycle detected at ${gateId}`);
    if (visited.has(gateId)) return;
    visiting.add(gateId);
    gates.get(gateId).dependsOn.forEach(visit);
    visiting.delete(gateId);
    visited.add(gateId);
  }

  traceability.gates.forEach((gate) => visit(gate.id));
  assert.ok(traceability.gates.every((gate) => gate.lifecycle === "planned"));
  assert.ok(traceability.gates.every((gate) => gate.enforcement === "none"));
});

test("[TST-100] rejects requirements that claim enforcement without active evidence and a gate", () => {
  for (const [lifecycle, enforcement] of [
    ["planned", "observed"],
    ["planned", "enforced"],
    ["active", "none"],
    ["superseded", "observed"],
    ["superseded", "enforced"],
    ["retired", "observed"],
    ["retired", "enforced"]
  ]) {
    assert.throws(
      () => validateLifecycleAndEnforcement({ lifecycle, enforcement }, "mutation"),
      /invalid lifecycle\/enforcement combination/
    );
  }

  const plannedEnforced = structuredClone(traceability);
  plannedEnforced.requirements[0] = {
    ...plannedEnforced.requirements[0],
    lifecycle: "planned",
    enforcement: "enforced"
  };
  assert.throws(() => validateEnforcement(plannedEnforced), /invalid lifecycle\/enforcement combination/);

  const missingTest = structuredClone(traceability);
  missingTest.requirements[0] = {
    ...missingTest.requirements[0],
    enforcement: "enforced",
    testIds: []
  };
  assert.throws(() => validateEnforcement(missingTest), /without active executable coverage/);

  const ungatedEnforced = structuredClone(traceability);
  ungatedEnforced.requirements[0] = {
    ...ungatedEnforced.requirements[0],
    enforcement: "enforced"
  };
  assert.throws(() => validateEnforcement(ungatedEnforced), /without an enforcing gate/);

  for (const enforcement of ["none", "observed"]) {
    const inactiveGate = structuredClone(traceability);
    inactiveGate.requirements[0] = {
      ...inactiveGate.requirements[0],
      enforcement: "enforced",
      enforcingGateIds: ["GATE-001"]
    };
    inactiveGate.gates[0] = {
      ...inactiveGate.gates[0],
      lifecycle: "active",
      enforcement
    };
    assert.throws(
      () => validateEnforcement(inactiveGate),
      enforcement === "none" ? /invalid lifecycle\/enforcement combination/ : /non-enforced gate/
    );
  }
});

test("[TST-101] recognizes observed contracts as executable but not release-blocking", () => {
  assert.doesNotThrow(() => validateEnforcement(traceability));
  assert.ok(traceability.requirements.every((requirement) =>
    requirement.enforcement !== "observed" || requirement.lifecycle === "active"
  ));
  assert.equal(traceability.requirements.some((requirement) => requirement.enforcement === "enforced"), false);
  const falselyBlockingObserved = structuredClone(traceability);
  falselyBlockingObserved.requirements[0].enforcingGateIds = ["GATE-001"];
  falselyBlockingObserved.gates[0] = {
    ...falselyBlockingObserved.gates[0],
    lifecycle: "active",
    enforcement: "enforced",
    testIds: ["TST-093"]
  };
  assert.throws(() => validateEnforcement(falselyBlockingObserved), /marked observed but is enforced/);
});

test("[TST-102] reports planned, observed, and enforced coverage separately", () => {
  const report = traceabilityReport(traceability);
  assert.deepEqual(report, {
    planned: 0,
    activeObserved: traceability.requirements.length,
    activeEnforced: 0,
    superseded: 0,
    retired: 0
  });
  assert.notEqual(report.activeObserved, report.activeEnforced);
  assert.deepEqual(summarizeStatus(traceability.tests), {
    planned: 0,
    activeObserved: traceability.tests.length,
    activeEnforced: 0,
    superseded: 0,
    retired: 0
  });
});

test("selects only materialized planned P0 requirements with satisfied predecessors", () => {
  assert.deepEqual(selectActivationCandidates(traceability), []);
  const candidateRegistry = structuredClone(traceability);
  candidateRegistry.requirements.push({
    id: "REQ-075",
    title: "Navigation validation completes before branch topology is accepted",
    statement: "Branch topology acceptance requires successful navigation validation.",
    priority: "P0",
    parentInvariantIds: ["INV-012"],
    predecessorRequirementIds: ["REQ-074"],
    lifecycle: "planned",
    enforcement: "none",
    testIds: [],
    enforcingGateIds: [],
    supersedesRequirementIds: [],
    supersededByRequirementIds: []
  });
  assert.deepEqual(
    selectActivationCandidates(candidateRegistry).map((requirement) => requirement.id),
    ["REQ-075"]
  );
});
