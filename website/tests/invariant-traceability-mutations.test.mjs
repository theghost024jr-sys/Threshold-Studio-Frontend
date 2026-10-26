import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { validateTraceabilityRegistry } from "../scripts/validate-invariant-traceability.mjs";

const registry = await readFile(
  new URL("../config/invariant-traceability.json", import.meta.url),
  "utf8"
).then(JSON.parse);
const execFileAsync = promisify(execFile);
const repositoryRoot = new URL("../../", import.meta.url);
const schemaWorkflow = await readFile(
  new URL(".github/workflows/test.yml", repositoryRoot),
  "utf8"
);
const schemaCheckScript = fileURLToPath(
  new URL("../scripts/check-invariant-traceability.mjs", import.meta.url)
);

function clone(value) {
  return structuredClone(value);
}

function findRequired(collection, id) {
  const record = collection.find((item) => item.id === id);
  assert.ok(record, `Missing fixture record ${id}`);
  return record;
}

function expectInvalid(mutatedRegistry, pattern) {
  assert.throws(() => validateTraceabilityRegistry(mutatedRegistry), pattern);
}

test("[TST-103] accepts the baseline registry", () => {
  assert.doesNotThrow(() => validateTraceabilityRegistry(clone(registry)));
});

for (const [lifecycle, enforcement] of [
  ["planned", "observed"],
  ["planned", "enforced"],
  ["active", "none"],
  ["superseded", "observed"],
  ["superseded", "enforced"],
  ["retired", "observed"],
  ["retired", "enforced"]
]) {
  test(`[TST-103] rejects ${lifecycle}/${enforcement}`, () => {
    const mutated = clone(registry);
    const requirement = findRequired(mutated.requirements, "REQ-141");
    requirement.lifecycle = lifecycle;
    requirement.enforcement = enforcement;
    expectInvalid(mutated, /invalid lifecycle\/enforcement combination/i);
  });
}

test("[TST-103] rejects unknown lifecycle and enforcement values", () => {
  const unknownLifecycle = clone(registry);
  findRequired(unknownLifecycle.requirements, "REQ-141").lifecycle = "imagined";
  expectInvalid(unknownLifecycle, /invalid lifecycle/i);

  const unknownEnforcement = clone(registry);
  findRequired(unknownEnforcement.requirements, "REQ-141").enforcement = "claimed";
  expectInvalid(unknownEnforcement, /invalid enforcement/i);
});

test("[TST-103] rejects enforced requirements without executable coverage or an enforcing gate", () => {
  const missingTests = clone(registry);
  const requirement = findRequired(missingTests.requirements, "REQ-141");
  Object.assign(requirement, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [],
    enforcingGateIds: ["GATE-001"]
  });
  expectInvalid(missingTests, /enforced without active executable coverage/i);

  const missingGate = clone(registry);
  Object.assign(findRequired(missingGate.requirements, "REQ-141"), {
    lifecycle: "active",
    enforcement: "enforced",
    enforcingGateIds: []
  });
  expectInvalid(missingGate, /enforced without an enforcing gate/i);
});

test("[TST-103] rejects missing, inactive, or non-enforced enforcing gates", () => {
  const missingGate = clone(registry);
  Object.assign(findRequired(missingGate.requirements, "REQ-141"), {
    lifecycle: "active",
    enforcement: "enforced",
    enforcingGateIds: ["GATE-999"]
  });
  expectInvalid(missingGate, /references missing gate GATE-999/i);

  for (const enforcement of ["none", "observed"]) {
    const mutated = clone(registry);
    const requirement = findRequired(mutated.requirements, "REQ-141");
    const gate = findRequired(mutated.gates, "GATE-001");
    Object.assign(requirement, {
      lifecycle: "active",
      enforcement: "enforced",
      enforcingGateIds: [gate.id]
    });
    Object.assign(
      gate,
      enforcement === "none"
        ? { lifecycle: "planned", enforcement: "none" }
        : { lifecycle: "active", enforcement: "observed" }
    );
    expectInvalid(
      mutated,
      enforcement === "none" ? /depends on non-active gate/i : /depends on non-enforced gate/i
    );
  }
});

test("[TST-103] rejects gate coverage gaps, inactive tests, and observed release claims", () => {
  const missingGateTest = clone(registry);
  const requirement = findRequired(missingGateTest.requirements, "REQ-141");
  const gate = findRequired(missingGateTest.gates, "GATE-001");
  Object.assign(requirement, {
    lifecycle: "active",
    enforcement: "enforced",
    enforcingGateIds: [gate.id]
  });
  Object.assign(gate, { lifecycle: "active", enforcement: "enforced", testIds: ["TST-079"] });
  expectInvalid(missingGateTest, /does not execute a test covering REQ-141/i);

  const inactiveTest = clone(registry);
  const mappedTest = findRequired(inactiveTest.tests, "TST-100");
  const activeGate = findRequired(inactiveTest.gates, "GATE-001");
  Object.assign(findRequired(inactiveTest.requirements, "REQ-141"), {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [mappedTest.id],
    enforcingGateIds: [activeGate.id]
  });
  Object.assign(mappedTest, { lifecycle: "planned", enforcement: "none" });
  Object.assign(activeGate, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [mappedTest.id]
  });
  expectInvalid(inactiveTest, /depends on non-active test/i);

  const missingTest = clone(registry);
  const missingTestRequirement = findRequired(missingTest.requirements, "REQ-141");
  const missingTestGate = findRequired(missingTest.gates, "GATE-001");
  Object.assign(missingTestRequirement, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: ["TST-999"],
    enforcingGateIds: [missingTestGate.id]
  });
  Object.assign(missingTestGate, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: ["TST-999"]
  });
  expectInvalid(missingTest, /references unknown test TST-999/i);

  const observedButGated = clone(registry);
  const observedRequirement = findRequired(observedButGated.requirements, "REQ-142");
  const observedGate = findRequired(observedButGated.gates, "GATE-001");
  observedRequirement.enforcingGateIds = [observedGate.id];
  Object.assign(observedGate, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [...observedRequirement.testIds]
  });
  expectInvalid(observedButGated, /marked observed but is enforced by GATE-001/i);
});

test("[TST-103] rejects duplicate requirements, uncovered active P0 requirements, and gate cycles", () => {
  const duplicate = clone(registry);
  duplicate.requirements.push(clone(findRequired(duplicate.requirements, "REQ-141")));
  expectInvalid(duplicate, /duplicate requirement ID REQ-141/i);

  const uncovered = clone(registry);
  findRequired(uncovered.requirements, "REQ-141").testIds = [];
  expectInvalid(uncovered, /REQ-141 is observed without active executable coverage/i);

  const cyclic = clone(registry);
  findRequired(cyclic.gates, "GATE-001").predecessorGateIds = ["GATE-010"];
  expectInvalid(cyclic, /gate graph is cyclic/i);
});

test("[TST-103] rejects incomplete, out-of-range, or falsely evidenced materialized requirements", () => {
  const missingTitle = clone(registry);
  delete findRequired(missingTitle.requirements, "REQ-141").title;
  expectInvalid(missingTitle, /REQ-141 has no title/i);

  const missingStatement = clone(registry);
  delete findRequired(missingStatement.requirements, "REQ-141").statement;
  expectInvalid(missingStatement, /REQ-141 has no statement/i);

  const outsideAllocation = clone(registry);
  const copied = clone(findRequired(outsideAllocation.requirements, "REQ-141"));
  copied.id = "REQ-146";
  outsideAllocation.requirements.push(copied);
  expectInvalid(outsideAllocation, /falls outside the allocated requirement range/i);

  const plannedWithEvidence = clone(registry);
  const requirement = findRequired(plannedWithEvidence.requirements, "REQ-141");
  Object.assign(requirement, {
    lifecycle: "planned",
    enforcement: "none",
    testIds: ["TST-100"],
    enforcingGateIds: []
  });
  expectInvalid(plannedWithEvidence, /planned but claims executable coverage/i);
});

test("[TST-103] rejects self-referential and cyclic materialized requirement dependencies", () => {
  const selfDependent = clone(registry);
  findRequired(selfDependent.requirements, "REQ-141").predecessorRequirementIds = ["REQ-141"];
  expectInvalid(selfDependent, /REQ-141 cannot depend on itself/i);

  const cyclic = clone(registry);
  const first = findRequired(cyclic.requirements, "REQ-141");
  const second = findRequired(cyclic.requirements, "REQ-142");
  first.predecessorRequirementIds = [second.id];
  second.predecessorRequirementIds = [first.id];
  expectInvalid(cyclic, /requirement dependency graph is cyclic/i);
});

test("[TST-103] rejects non-canonical record fields, identifiers, and lifecycle evidence", () => {
  const extraField = clone(registry);
  findRequired(extraField.requirements, "REQ-141").planningStatus = "eligible";
  expectInvalid(extraField, /unsupported canonical field planningStatus/i);

  const duplicateTest = clone(registry);
  const duplicateTestRequirement = findRequired(duplicateTest.requirements, "REQ-141");
  duplicateTestRequirement.testIds.push(duplicateTestRequirement.testIds[0]);
  expectInvalid(duplicateTest, /testIds contains duplicate IDs/i);

  const observedWithGate = clone(registry);
  findRequired(observedWithGate.requirements, "REQ-141").enforcingGateIds = ["GATE-001"];
  expectInvalid(observedWithGate, /observed but has enforcing gates/i);

  const supersededWithoutSuccessor = clone(registry);
  const supersededRequirement = findRequired(supersededWithoutSuccessor.requirements, "REQ-141");
  Object.assign(supersededRequirement, {
    lifecycle: "superseded",
    enforcement: "none"
  });
  expectInvalid(supersededWithoutSuccessor, /superseded without a successor/i);
});

test("[TST-103] blocks downstream CI work when schema validation fails", async () => {
  assert.match(schemaWorkflow, /schema-validation:/);
  assert.match(schemaWorkflow, /Validate traceability schema and mutations[\s\S]*npm run test:traceability/);
  assert.match(schemaWorkflow, /build-test-deploy:\s*\n\s+needs: schema-validation/);

  const validResult = await execFileAsync(process.execPath, [schemaCheckScript], {
    cwd: fileURLToPath(repositoryRoot)
  });
  assert.match(validResult.stdout, /Traceability registry is valid/);

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "threshold-invalid-traceability-"));
  const invalidRegistryPath = join(temporaryDirectory, "invariant-traceability.json");
  const invalidRegistry = clone(registry);
  findRequired(invalidRegistry.requirements, "REQ-141").statement = "";
  await writeFile(invalidRegistryPath, JSON.stringify(invalidRegistry), "utf8");

  try {
    await assert.rejects(
      execFileAsync(process.execPath, [schemaCheckScript, invalidRegistryPath], {
        cwd: fileURLToPath(repositoryRoot)
      }),
      /Traceability registry validation failed: REQ-141 has no statement/
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("[TST-103] rejects an enforced schema gate that is removed or bypassed", () => {
  const enforced = clone(registry);
  const schemaGate = findRequired(enforced.gates, "GATE-011");
  Object.assign(schemaGate, {
    lifecycle: "active",
    enforcement: "enforced"
  });
  ["REQ-141", "REQ-142", "REQ-143", "REQ-144"].forEach((requirementId) => {
    Object.assign(findRequired(enforced.requirements, requirementId), {
      lifecycle: "active",
      enforcement: "enforced",
      enforcingGateIds: [schemaGate.id]
    });
  });
  assert.doesNotThrow(() => validateTraceabilityRegistry(enforced));

  Object.assign(schemaGate, {
    lifecycle: "planned",
    enforcement: "none"
  });
  expectInvalid(enforced, /depends on non-active gate GATE-011/i);
});

test("[TST-103] accepts a fully backed synthetic enforced contract", () => {
  const mutated = clone(registry);
  const requirement = findRequired(mutated.requirements, "REQ-141");
  const mappedTest = findRequired(mutated.tests, "TST-100");
  const gate = findRequired(mutated.gates, "GATE-001");

  Object.assign(requirement, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [mappedTest.id],
    enforcingGateIds: [gate.id]
  });
  Object.assign(gate, {
    lifecycle: "active",
    enforcement: "enforced",
    testIds: [mappedTest.id]
  });

  assert.doesNotThrow(() => validateTraceabilityRegistry(mutated));
});
