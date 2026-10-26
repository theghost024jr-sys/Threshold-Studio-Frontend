import { validateEnforcement } from "./invariant-traceability-report.js";

const CANONICAL_REQUIREMENT_FIELDS = new Set([
  "id",
  "title",
  "statement",
  "priority",
  "architecturePrincipleIds",
  "parentInvariantIds",
  "predecessorRequirementIds",
  "lifecycle",
  "enforcement",
  "testIds",
  "enforcingGateIds",
  "supersedesRequirementIds",
  "supersededByRequirementIds"
]);

function assertRegistry(condition, message) {
  if (!condition) throw new Error(message);
}

function validateIdArray(value, pattern, context, { minItems = 0 } = {}) {
  assertRegistry(Array.isArray(value), `${context} must be an array.`);
  assertRegistry(value.length >= minItems, `${context} must contain at least ${minItems} item(s).`);
  assertRegistry(new Set(value).size === value.length, `${context} contains duplicate IDs.`);
  value.forEach((id) => {
    assertRegistry(typeof id === "string" && pattern.test(id), `${context} has invalid ID ${id}.`);
  });
}

function validateCanonicalRequirementShape(requirement, principleIds) {
  assertRegistry(requirement && typeof requirement === "object" && !Array.isArray(requirement), "Requirement record is invalid.");
  Object.keys(requirement).forEach((field) => {
    assertRegistry(CANONICAL_REQUIREMENT_FIELDS.has(field), `${requirement.id} has unsupported canonical field ${field}.`);
  });
  ["id", "title", "statement", "priority", "parentInvariantIds", "predecessorRequirementIds",
    "lifecycle", "enforcement", "testIds", "enforcingGateIds", "supersedesRequirementIds",
    "supersededByRequirementIds"].forEach((field) => {
    assertRegistry(Object.hasOwn(requirement, field), `${requirement.id || "Requirement"} has no ${field}.`);
  });
  assertRegistry(/^REQ-\d{3}$/.test(requirement.id), `Invalid requirement ID ${requirement.id}.`);
  assertRegistry(typeof requirement.title === "string" && requirement.title.trim(), `${requirement.id} has no title.`);
  assertRegistry(typeof requirement.statement === "string" && requirement.statement.trim(), `${requirement.id} has no statement.`);
  assertRegistry(["P0", "P1", "P2", "P3"].includes(requirement.priority), `${requirement.id} has an invalid priority.`);
  validateIdArray(requirement.parentInvariantIds, /^INV-\d{3}$/, `${requirement.id} parentInvariantIds`, { minItems: 1 });
  validateIdArray(requirement.predecessorRequirementIds, /^REQ-\d{3}$/, `${requirement.id} predecessorRequirementIds`);
  validateIdArray(requirement.testIds, /^TST-\d{3}$/, `${requirement.id} testIds`);
  validateIdArray(requirement.enforcingGateIds, /^GATE-\d{3}$/, `${requirement.id} enforcingGateIds`);
  validateIdArray(requirement.supersedesRequirementIds, /^REQ-\d{3}$/, `${requirement.id} supersedesRequirementIds`);
  validateIdArray(requirement.supersededByRequirementIds, /^REQ-\d{3}$/, `${requirement.id} supersededByRequirementIds`);
  if (Object.hasOwn(requirement, "architecturePrincipleIds")) {
    validateIdArray(requirement.architecturePrincipleIds, /^ASP-\d{3}$/, `${requirement.id} architecturePrincipleIds`);
    requirement.architecturePrincipleIds.forEach((principleId) => {
      assertRegistry(principleIds.has(principleId), `${requirement.id} references unknown architecture principle ${principleId}.`);
    });
  }
  if (requirement.lifecycle === "planned") {
    assertRegistry(requirement.enforcement === "none", `${requirement.id} is planned but has enforcement ${requirement.enforcement}.`);
    assertRegistry(requirement.testIds.length === 0, `${requirement.id} is planned but claims executable coverage.`);
    assertRegistry(requirement.enforcingGateIds.length === 0, `${requirement.id} is planned but has enforcing gates.`);
    assertRegistry(requirement.supersededByRequirementIds.length === 0, `${requirement.id} is planned but has superseding requirements.`);
  }
  if (requirement.lifecycle === "active") {
    assertRegistry(requirement.testIds.length > 0, `${requirement.id} is active without executable coverage.`);
    assertRegistry(requirement.supersededByRequirementIds.length === 0, `${requirement.id} is active but has superseding requirements.`);
  }
  if (requirement.lifecycle === "active" && requirement.enforcement === "observed") {
    assertRegistry(requirement.enforcingGateIds.length === 0, `${requirement.id} is observed but has enforcing gates.`);
  }
  if (requirement.lifecycle === "superseded") {
    assertRegistry(requirement.enforcingGateIds.length === 0, `${requirement.id} is superseded but has enforcing gates.`);
    assertRegistry(requirement.supersededByRequirementIds.length > 0, `${requirement.id} is superseded without a successor.`);
  }
  if (requirement.lifecycle === "retired") {
    assertRegistry(requirement.enforcingGateIds.length === 0, `${requirement.id} is retired but has enforcing gates.`);
  }
}

function indexRecords(records, label) {
  const indexed = new Map();
  for (const record of records) {
    assertRegistry(typeof record?.id === "string", `${label} record has no ID.`);
    assertRegistry(!indexed.has(record.id), `Duplicate ${label} ID ${record.id}.`);
    indexed.set(record.id, record);
  }
  return indexed;
}

function validateGateGraph(gates) {
  const gatesById = indexRecords(gates, "gate");
  const visiting = new Set();
  const visited = new Set();

  function visit(gateId) {
    assertRegistry(gatesById.has(gateId), `Unknown gate ${gateId}.`);
    assertRegistry(!visiting.has(gateId), `Gate graph is cyclic at ${gateId}.`);
    if (visited.has(gateId)) return;
    visiting.add(gateId);
    const gate = gatesById.get(gateId);
    (gate.predecessorGateIds || gate.dependsOn || []).forEach(visit);
    visiting.delete(gateId);
    visited.add(gateId);
  }

  gates.forEach((gate) => visit(gate.id));
}

function requirementNumber(id) {
  const match = /^REQ-(\d{3})$/.exec(id);
  assertRegistry(match, `Invalid requirement ID ${id}.`);
  return Number(match[1]);
}

function validateRequirementAllocation(registry, requirements) {
  const allocation = registry.requirementIdAllocation;
  assertRegistry(allocation, "Requirement ID allocation is required.");
  const start = requirementNumber(allocation.start);
  const end = requirementNumber(allocation.end);
  assertRegistry(start <= end, "Requirement ID allocation is invalid.");

  requirements.forEach((requirement) => {
    const number = requirementNumber(requirement.id);
    assertRegistry(
      number >= start && number <= end,
      `${requirement.id} falls outside the allocated requirement range.`
    );
  });
}

function validateRequirementDependencies(requirementsById, requirements) {
  const visiting = new Set();
  const visited = new Set();

  function visit(requirementId) {
    assertRegistry(!visiting.has(requirementId), `Requirement dependency graph is cyclic at ${requirementId}.`);
    if (visited.has(requirementId)) return;
    visiting.add(requirementId);
    const requirement = requirementsById.get(requirementId);
    requirement.predecessorRequirementIds.forEach((predecessorId) => {
      assertRegistry(
        predecessorId !== requirementId,
        `${requirementId} cannot depend on itself.`
      );
      assertRegistry(
        requirementsById.has(predecessorId),
        `${requirementId} references unmaterialized predecessor ${predecessorId}.`
      );
      visit(predecessorId);
    });
    visiting.delete(requirementId);
    visited.add(requirementId);
  }

  requirements.forEach((requirement) => visit(requirement.id));
}

export function validateTraceabilityRegistry(registry) {
  assertRegistry(registry && typeof registry === "object", "Traceability registry is required.");
  const requirements = registry.requirements || [];
  const tests = registry.tests || [];
  const gates = registry.gates || [];
  const fullLoops = registry.fullLoops || [];
  const invariantIds = new Set((registry.domainInvariants || []).map((invariant) => invariant.id));
  const principleIds = new Set((registry.principles || []).map((principle) => principle.id));
  const requirementsById = indexRecords(requirements, "requirement");
  const testsById = indexRecords(tests, "test");

  indexRecords(registry.principles || [], "architecture principle");
  indexRecords(registry.kernelInvariants || [], "kernel invariant");
  indexRecords(registry.domainInvariants || [], "domain invariant");
  indexRecords(fullLoops, "full-loop");
  validateRequirementAllocation(registry, requirements);
  validateGateGraph(gates);
  validateEnforcement(registry);

  requirements.forEach((requirement) => {
    const parentInvariantIds = requirement.parentInvariantIds;
    validateCanonicalRequirementShape(requirement, principleIds);
    parentInvariantIds.forEach((invariantId) => {
      assertRegistry(invariantIds.has(invariantId), `${requirement.id} references unknown invariant ${invariantId}.`);
    });
    [...requirement.supersedesRequirementIds, ...requirement.supersededByRequirementIds].forEach((relatedId) => {
      assertRegistry(requirementsById.has(relatedId), `${requirement.id} references unmaterialized supersession ${relatedId}.`);
    });
    if (requirement.lifecycle === "active" && ["P0", "P1"].includes(requirement.priority)) {
      assertRegistry(requirement.testIds?.length > 0, `${requirement.id} has no coverage.`);
    }
    requirement.testIds?.forEach((testId) => {
      const contractTest = testsById.get(testId);
      assertRegistry(contractTest, `${requirement.id} references missing test ${testId}.`);
      assertRegistry(
        contractTest.requirementIds?.includes(requirement.id),
        `${testId} does not identify ${requirement.id}.`
      );
    });
  });

  tests.forEach((contractTest) => {
    contractTest.requirementIds?.forEach((requirementId) => {
      assertRegistry(requirementsById.has(requirementId), `${contractTest.id} references missing requirement ${requirementId}.`);
    });
  });
  validateRequirementDependencies(requirementsById, requirements);
}

export function selectActivationCandidates(registry) {
  validateTraceabilityRegistry(registry);
  const requirementsById = new Map(
    registry.requirements.map((requirement) => [requirement.id, requirement])
  );
  return registry.requirements.filter((requirement) =>
    requirement.priority === "P0"
    && requirement.lifecycle === "planned"
    && requirement.enforcement === "none"
    && requirement.supersededByRequirementIds.length === 0
    && requirement.predecessorRequirementIds.every((id) => {
      const predecessor = requirementsById.get(id);
      return predecessor.lifecycle === "active";
    })
  );
}
