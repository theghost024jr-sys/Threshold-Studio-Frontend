const LIFECYCLES = new Set(["planned", "active", "superseded", "retired"]);
const ENFORCEMENTS = new Set(["none", "observed", "enforced"]);
const VALID_STATUS_COMBINATIONS = new Set([
  "planned:none",
  "active:observed",
  "active:enforced",
  "superseded:none",
  "retired:none"
]);

function assertRegistry(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateLifecycleAndEnforcement(record, context) {
  assertRegistry(LIFECYCLES.has(record.lifecycle), `${context} has invalid lifecycle: ${record.lifecycle}`);
  assertRegistry(ENFORCEMENTS.has(record.enforcement), `${context} has invalid enforcement: ${record.enforcement}`);
  const combination = `${record.lifecycle}:${record.enforcement}`;
  assertRegistry(
    VALID_STATUS_COMBINATIONS.has(combination),
    `${context} has invalid lifecycle/enforcement combination: ${combination}`
  );
}

export function validateEnforcement(traceability) {
  const testsById = new Map(traceability.tests.map((item) => [item.id, item]));
  const gatesById = new Map(traceability.gates.map((item) => [item.id, item]));
  const requirements = traceability.requirements || [];
  const collections = {
    requirements,
    tests: traceability.tests || [],
    gates: traceability.gates || [],
    fullLoops: traceability.fullLoops || []
  };

  Object.entries(collections).forEach(([collection, records]) => {
    records.forEach((record) => validateLifecycleAndEnforcement(record, `${collection}:${record.id}`));
  });

  for (const requirement of requirements) {
    if (requirement.lifecycle === "planned") {
      assertRegistry(
        requirement.testIds?.length === 0 && requirement.enforcingGateIds?.length === 0,
        `${requirement.id} is planned but claims executable coverage.`
      );
    }
    if (requirement.enforcement === "observed") {
      assertRegistry(
        requirement.lifecycle === "active" && requirement.testIds?.length > 0,
        `${requirement.id} is observed without active executable coverage.`
      );
    }
    if (requirement.enforcement === "enforced") {
      assertRegistry(
        requirement.lifecycle === "active" && requirement.testIds?.length > 0,
        `${requirement.id} is enforced without active executable coverage.`
      );
      assertRegistry(
        Array.isArray(requirement.enforcingGateIds) && requirement.enforcingGateIds.length > 0,
        `${requirement.id} is enforced without an enforcing gate.`
      );
      requirement.enforcingGateIds.forEach((gateId) => {
        const gate = gatesById.get(gateId);
        assertRegistry(gate, `${requirement.id} references missing gate ${gateId}.`);
        assertRegistry(gate.lifecycle === "active", `${requirement.id} depends on non-active gate ${gateId}.`);
        assertRegistry(gate.enforcement === "enforced", `${requirement.id} depends on non-enforced gate ${gateId}.`);
        assertRegistry(
          gate.testIds?.some((testId) => requirement.testIds.includes(testId)),
          `${gateId} does not execute a test covering ${requirement.id}.`
        );
      });
    }
    requirement.testIds?.forEach((testId) => {
      const contractTest = testsById.get(testId);
      assertRegistry(contractTest, `${requirement.id} references unknown test ${testId}.`);
      if (requirement.enforcement === "enforced") {
        assertRegistry(
          contractTest.lifecycle === "active",
          `${requirement.id} depends on non-active test ${testId}.`
        );
      }
    });
    if (requirement.enforcement === "observed") {
      (requirement.enforcingGateIds || []).forEach((gateId) => {
        const gate = gatesById.get(gateId);
        assertRegistry(
          !gate || gate.lifecycle !== "active" || gate.enforcement !== "enforced",
          `${requirement.id} is marked observed but is enforced by ${gateId}.`
        );
      });
    }
  }
}

export function summarizeStatus(records) {
  return records.reduce((summary, record) => {
    if (record.lifecycle === "planned") summary.planned += 1;
    else if (record.lifecycle === "active" && record.enforcement === "observed") {
      summary.activeObserved += 1;
    } else if (record.lifecycle === "active" && record.enforcement === "enforced") {
      summary.activeEnforced += 1;
    } else if (record.lifecycle === "superseded") summary.superseded += 1;
    else if (record.lifecycle === "retired") summary.retired += 1;
    return summary;
  }, { planned: 0, activeObserved: 0, activeEnforced: 0, superseded: 0, retired: 0 });
}

export function traceabilityReport(traceability) {
  return summarizeStatus(traceability.requirements || []);
}
