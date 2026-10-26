import {
  INVARIANT_FAILURE,
  InvariantViolation,
  requireInvariant
} from "./invariant-kernel.js";

export async function validateIntegrityBeforeNavigation({ integrity, navigation }) {
  requireInvariant(
    typeof integrity === "function" && typeof navigation === "function",
    INVARIANT_FAILURE.UNSUPPORTED_CLAIM,
    "Validation pipeline requires Integrity and Navigation validators."
  );
  try {
    await integrity();
  } catch (cause) {
    const error = new InvariantViolation(
      INVARIANT_FAILURE.DEPENDENCY_ORDER_VIOLATION,
      "Navigation cannot begin because Integrity validation failed.",
      { blockedStage: "navigation", failedStage: "integrity" }
    );
    error.cause = cause;
    throw error;
  }
  return navigation();
}
