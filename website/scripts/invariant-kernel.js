export const INVARIANT_FAILURE = Object.freeze({
  TRUTH_CONTRADICTION: "TRUTH_CONTRADICTION",
  UNSUPPORTED_CLAIM: "UNSUPPORTED_CLAIM",
  INVALID_EDGE: "INVALID_EDGE",
  PRESENTATION_AUTHORITY_VIOLATION: "PRESENTATION_AUTHORITY_VIOLATION",
  UNEARNED_EFFECT: "UNEARNED_EFFECT",
  HISTORY_ERASURE: "HISTORY_ERASURE",
  SOURCE_RENDER_COUPLING: "SOURCE_RENDER_COUPLING",
  UNJUSTIFIED_CAPABILITY: "UNJUSTIFIED_CAPABILITY",
  CHAMBER_FLATTENING: "CHAMBER_FLATTENING",
  DEPENDENCY_ORDER_VIOLATION: "DEPENDENCY_ORDER_VIOLATION"
});

export class InvariantViolation extends Error {
  constructor(code, message, evidence = {}) {
    super(message);
    this.name = "InvariantViolation";
    this.code = code;
    this.evidence = evidence;
  }
}

export function requireInvariant(condition, code, message, evidence) {
  if (!condition) {
    throw new InvariantViolation(code, message, evidence);
  }
}

export function requireSupportedClaim(condition, message, evidence) {
  requireInvariant(condition, INVARIANT_FAILURE.UNSUPPORTED_CLAIM, message, evidence);
}

export function requireResolvedEdge(condition, message, evidence) {
  requireInvariant(condition, INVARIANT_FAILURE.INVALID_EDGE, message, evidence);
}

export function requireEarnedEffect(condition, message, evidence) {
  requireInvariant(condition, INVARIANT_FAILURE.UNEARNED_EFFECT, message, evidence);
}

export function requireContinuity(condition, message, evidence) {
  requireInvariant(condition, INVARIANT_FAILURE.HISTORY_ERASURE, message, evidence);
}

export function requirePresentationAuthority(condition, message, evidence) {
  requireInvariant(
    condition,
    INVARIANT_FAILURE.PRESENTATION_AUTHORITY_VIOLATION,
    message,
    evidence
  );
}
