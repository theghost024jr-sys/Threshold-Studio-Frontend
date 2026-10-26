import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { INVARIANT_FAILURE } from "../scripts/invariant-kernel.js";
import { validateIntegrityBeforeNavigation } from "../scripts/validation-pipeline.mjs";
import { validateTraceabilityRegistry } from "../scripts/validate-invariant-traceability.mjs";

test("[TST-104] blocks Navigation when Integrity validation fails", async () => {
  let navigationCalls = 0;

  await assert.rejects(
    validateIntegrityBeforeNavigation({
      integrity() {
        throw new Error("Corrupted integrity fixture.");
      },
      navigation() {
        navigationCalls += 1;
      }
    }),
    (error) => error.code === INVARIANT_FAILURE.DEPENDENCY_ORDER_VIOLATION
      && error.evidence.failedStage === "integrity"
      && error.evidence.blockedStage === "navigation"
  );
  assert.equal(navigationCalls, 0);
});

test("runs Navigation only after the actual registry Integrity validator succeeds", async () => {
  const registry = JSON.parse(await readFile(
    new URL("../config/invariant-traceability.json", import.meta.url),
    "utf8"
  ));
  const stages = [];

  await validateIntegrityBeforeNavigation({
    integrity() {
      stages.push("integrity");
      validateTraceabilityRegistry(registry);
    },
    navigation() {
      stages.push("navigation");
    }
  });

  assert.deepEqual(stages, ["integrity", "navigation"]);
});
