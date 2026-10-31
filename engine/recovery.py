"""Threshold recovery contracts and deterministic recovery-policy routing.

Recovery restores process integrity. It does not establish world truth.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Mapping


class ErrorFamily(str, Enum):
    NO_VOTE = "no_vote"
    INPUT = "input"
    EVIDENCE = "evidence"
    STATE = "state"
    CONTRACT = "contract"
    SEQUENCE = "sequence"
    NUMERIC = "numeric"
    PRESSURE = "pressure"
    FORCE = "force"
    PHYSICS = "physics"
    STRUCTURE = "structure"
    TOPOLOGY = "topology"
    AUTHORITY = "authority"
    CONSISTENCY = "consistency"
    SYSTEM = "system"


class ErrorSeverity(str, Enum):
    INFO = "info"
    RECOVERABLE = "recoverable"
    BLOCKING = "blocking"
    FATAL = "fatal"


class ErrorDisposition(str, Enum):
    CONTINUE = "continue"
    DEFER = "defer"
    REJECT = "reject"
    ABORT_EVALUATION = "abort_evaluation"
    ABORT_TRANSACTION = "abort_transaction"
    HALT_WORLD = "halt_world"


class RecoveryAction(str, Enum):
    CONTINUE = "continue"
    RETRY = "retry"
    REEVALUATE = "reevaluate"
    DEFER = "defer"
    REJECT = "reject"
    ABORT_EVALUATION = "abort_evaluation"
    ABORT_TRANSACTION = "abort_transaction"
    REBUILD_DERIVED_STATE = "rebuild_derived_state"
    QUARANTINE = "quarantine"
    HALT_WORLD = "halt_world"


class ThresholdLayer(str, Enum):
    MIRROR = "mirror"
    PRESSURE = "pressure"
    FORCE = "force"
    PHYSICS = "physics"
    STRUCTURE = "structure"
    TOPOLOGY = "topology"


class ErrorCode(str, Enum):
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    NO_FIELD_TARGET = "no_field_target"
    INPUT_INVALID_RANGE = "input_invalid_range"
    STATE_NODE_MISMATCH = "state_node_mismatch"
    CONTRACT_OUTPUT_INVALID = "contract_output_invalid"
    SEQUENCE_STALE = "sequence_stale"
    VERSION_MISMATCH = "version_mismatch"
    FORCE_INVALID_DIRECTION = "force_invalid_direction"
    PHYSICS_MISSING_CURRENT_FORCE = "physics_missing_current_force"
    PHYSICS_INVALID_MASS = "physics_invalid_mass"
    STRUCTURE_MISSING_PHYSICS_RESULT = "structure_missing_physics_result"
    TOPOLOGY_TRANSACTION_STALE = "topology_transaction_stale"
    TOPOLOGY_TRANSACTION_INVARIANT_FAILED = "topology_transaction_invariant_failed"
    AUTHORITY_HISTORY_REWRITE = "authority_history_rewrite"
    CONSISTENCY_PARTIAL_TRANSACTION = "consistency_partial_transaction"
    CONSISTENCY_CONTRADICTORY_AUTHORITY = "consistency_contradictory_authority"
    SYSTEM_STORAGE_FAILURE = "system_storage_failure"
    SYSTEM_REPLAY_DIVERGENCE = "system_replay_divergence"


@dataclass(frozen=True, slots=True)
class ThresholdError:
    error_id: str
    code: ErrorCode
    family: ErrorFamily
    layer: ThresholdLayer
    severity: ErrorSeverity
    disposition: ErrorDisposition
    world_tick: int
    node_id: str | None = None
    relationship_id: str | None = None
    flower_id: str | None = None
    source_sequence: int | None = None
    topology_version: int | None = None
    message: str = ""
    details: Mapping[str, Any] = field(default_factory=dict)
    caused_by: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class EvaluationCheckpoint:
    checkpoint_id: str
    layer: ThresholdLayer
    world_tick: int
    authoritative_topology_version: int
    derived_state: Any = None


@dataclass(frozen=True, slots=True)
class RecoveryContext:
    retry_count: int = 0
    max_retries: int = 1
    transaction_in_progress: bool = False
    derived_state_rebuildable: bool = False
    authoritative_checkpoint_valid: bool = True
    affected_subject_isolatable: bool = False
    authoritative_integrity_compromised: bool = False


@dataclass(frozen=True, slots=True)
class RecoveryDecision:
    action: RecoveryAction
    resume_from: ThresholdLayer | None = None
    retry_allowed: bool = False
    retry_count: int = 0
    authoritative_state_preserved: bool = True


_STALE_CODES = frozenset(
    {
        ErrorCode.SEQUENCE_STALE,
        ErrorCode.VERSION_MISMATCH,
        ErrorCode.TOPOLOGY_TRANSACTION_STALE,
    }
)
_FATAL_INTEGRITY_CODES = frozenset(
    {
        ErrorCode.SYSTEM_REPLAY_DIVERGENCE,
        ErrorCode.CONSISTENCY_PARTIAL_TRANSACTION,
        ErrorCode.CONSISTENCY_CONTRADICTORY_AUTHORITY,
    }
)
_TRANSIENT_CODES = frozenset({ErrorCode.SYSTEM_STORAGE_FAILURE})


def recover(
    error: ThresholdError,
    checkpoint: EvaluationCheckpoint,
    context: RecoveryContext,
) -> RecoveryDecision:
    """Select the narrowest recovery action without performing mutation."""

    _validate_context(context)
    if error.family is ErrorFamily.NO_VOTE:
        return RecoveryDecision(RecoveryAction.DEFER)
    if error.family is ErrorFamily.INPUT:
        return RecoveryDecision(RecoveryAction.REJECT)
    if error.code in _STALE_CODES:
        return RecoveryDecision(
            RecoveryAction.REEVALUATE,
            resume_from=checkpoint.layer,
        )
    if error.code in _FATAL_INTEGRITY_CODES:
        return RecoveryDecision(
            RecoveryAction.HALT_WORLD,
            authoritative_state_preserved=False,
        )
    if error.layer is ThresholdLayer.TOPOLOGY and context.transaction_in_progress:
        return RecoveryDecision(RecoveryAction.ABORT_TRANSACTION)
    if context.derived_state_rebuildable and context.authoritative_checkpoint_valid:
        return RecoveryDecision(
            RecoveryAction.REBUILD_DERIVED_STATE,
            resume_from=checkpoint.layer,
        )
    if context.affected_subject_isolatable:
        return RecoveryDecision(
            RecoveryAction.QUARANTINE,
            resume_from=checkpoint.layer,
        )
    if context.authoritative_integrity_compromised:
        return RecoveryDecision(
            RecoveryAction.HALT_WORLD,
            authoritative_state_preserved=False,
        )
    if error.code in _TRANSIENT_CODES and context.retry_count < context.max_retries:
        return RecoveryDecision(
            RecoveryAction.RETRY,
            resume_from=checkpoint.layer,
            retry_allowed=True,
            retry_count=context.retry_count + 1,
        )
    return RecoveryDecision(RecoveryAction.ABORT_EVALUATION)


def _validate_context(context: RecoveryContext) -> None:
    if context.retry_count < 0:
        raise ValueError("retry_count cannot be negative")
    if context.max_retries < 0:
        raise ValueError("max_retries cannot be negative")
    if context.retry_count > context.max_retries:
        raise ValueError("retry_count cannot exceed max_retries")
