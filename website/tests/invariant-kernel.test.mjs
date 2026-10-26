import assert from "node:assert/strict";
import test from "node:test";

import {
  INVARIANT_FAILURE,
  InvariantViolation,
  requireContinuity,
  requireEarnedEffect,
  requirePresentationAuthority,
  requireResolvedEdge,
  requireSupportedClaim
} from "../scripts/invariant-kernel.js";

test("emits stable, inspectable invariant failures", () => {
  const contracts = [
    [requireSupportedClaim, INVARIANT_FAILURE.UNSUPPORTED_CLAIM],
    [requireResolvedEdge, INVARIANT_FAILURE.INVALID_EDGE],
    [requireEarnedEffect, INVARIANT_FAILURE.UNEARNED_EFFECT],
    [requireContinuity, INVARIANT_FAILURE.HISTORY_ERASURE],
    [requirePresentationAuthority, INVARIANT_FAILURE.PRESENTATION_AUTHORITY_VIOLATION]
  ];

  for (const [contract, code] of contracts) {
    assert.throws(
      () => contract(false, "Rejected claim.", { source: "test" }),
      (error) => error instanceof InvariantViolation
        && error.code === code
        && error.evidence.source === "test"
    );
  }
});
