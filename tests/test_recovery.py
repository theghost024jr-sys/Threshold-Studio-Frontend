from engine.recovery import (
    ErrorCode,
    ErrorDisposition,
    ErrorFamily,
    ErrorSeverity,
    EvaluationCheckpoint,
    RecoveryAction,
    RecoveryContext,
    RecoveryDecision,
    ThresholdError,
    ThresholdLayer,
    recover,
)
from dataclasses import dataclass

from engine.topology import (
    FlowerTopology,
    NodeLifecycle,
    Relationship,
    RelationshipKind,
    TopologicalNode,
    TopologyContext,
    TopologyState,
    evaluate_topology,
)
from engine.structural import (
    ProposalType,
    StructuralProposal,
    StructuralRegime,
    StructuralResult,
)


@dataclass(frozen=True)
class DerivedState:
    sequence: int
    total: float


def _replay(checkpoint: DerivedState, contributions: tuple[float, ...]) -> DerivedState:
    return DerivedState(
        sequence=checkpoint.sequence + len(contributions),
        total=checkpoint.total + sum(contributions),
    )


def _checkpoint(layer: ThresholdLayer = ThresholdLayer.FORCE) -> EvaluationCheckpoint:
    return EvaluationCheckpoint(
        checkpoint_id="checkpoint-1",
        layer=layer,
        world_tick=1,
        authoritative_topology_version=14,
    )


def _error(
    code: ErrorCode,
    family: ErrorFamily,
    layer: ThresholdLayer,
    *,
    severity: ErrorSeverity = ErrorSeverity.RECOVERABLE,
    disposition: ErrorDisposition = ErrorDisposition.ABORT_EVALUATION,
) -> ThresholdError:
    return ThresholdError(
        error_id=f"error:{code.value}",
        code=code,
        family=family,
        layer=layer,
        severity=severity,
        disposition=disposition,
        world_tick=1,
    )


def test_insufficient_evidence_defers_without_retry() -> None:
    decision = recover(
        ThresholdError(
            error_id="no-vote-1",
            code=ErrorCode.INSUFFICIENT_EVIDENCE,
            family=ErrorFamily.NO_VOTE,
            layer=ThresholdLayer.MIRROR,
            severity=ErrorSeverity.INFO,
            disposition=ErrorDisposition.DEFER,
            world_tick=100,
        ),
        _checkpoint(),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.DEFER
    assert not decision.retry_allowed
    assert decision.retry_count == 0
    assert decision.authoritative_state_preserved


def test_topology_failure_aborts_transaction() -> None:
    decision = recover(
        _error(
            ErrorCode.TOPOLOGY_TRANSACTION_INVARIANT_FAILED,
            ErrorFamily.TOPOLOGY,
            ThresholdLayer.TOPOLOGY,
        ),
        _checkpoint(),
        RecoveryContext(transaction_in_progress=True),
    )

    assert decision.action is RecoveryAction.ABORT_TRANSACTION
    assert decision.authoritative_state_preserved


def test_fatal_integrity_failure_halts_world() -> None:
    decision = recover(
        _error(
            ErrorCode.SYSTEM_REPLAY_DIVERGENCE,
            ErrorFamily.SYSTEM,
            ThresholdLayer.TOPOLOGY,
            severity=ErrorSeverity.FATAL,
            disposition=ErrorDisposition.HALT_WORLD,
        ),
        _checkpoint(),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.HALT_WORLD
    assert not decision.authoritative_state_preserved


def test_retry_limit_never_creates_an_infinite_retry_loop() -> None:
    decision = recover(
        _error(
            ErrorCode.SYSTEM_STORAGE_FAILURE,
            ErrorFamily.SYSTEM,
            ThresholdLayer.FORCE,
        ),
        _checkpoint(),
        RecoveryContext(max_retries=1, retry_count=1),
    )

    assert decision.action is RecoveryAction.ABORT_EVALUATION
    assert not decision.retry_allowed


def test_deterministic_contract_failure_is_not_retried() -> None:
    decision = recover(
        _error(
            ErrorCode.CONTRACT_OUTPUT_INVALID,
            ErrorFamily.CONTRACT,
            ThresholdLayer.PRESSURE,
        ),
        _checkpoint(),
        RecoveryContext(max_retries=3),
    )

    assert decision.action is RecoveryAction.ABORT_EVALUATION
    assert not decision.retry_allowed


def test_stale_force_is_not_reused_as_current() -> None:
    decision = recover(
        _error(
            ErrorCode.SEQUENCE_STALE,
            ErrorFamily.SEQUENCE,
            ThresholdLayer.PRESSURE,
        ),
        _checkpoint(),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.REEVALUATE
    assert decision.resume_from is ThresholdLayer.FORCE
    assert decision.authoritative_state_preserved
    assert not hasattr(decision, "force")
    assert not hasattr(decision, "effective_vector")


def test_stale_topology_transaction_requests_reevaluation() -> None:
    decision = recover(
        _error(
            ErrorCode.TOPOLOGY_TRANSACTION_STALE,
            ErrorFamily.SEQUENCE,
            ThresholdLayer.TOPOLOGY,
        ),
        _checkpoint(ThresholdLayer.TOPOLOGY),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.REEVALUATE
    assert decision.resume_from is ThresholdLayer.TOPOLOGY
    assert decision.authoritative_state_preserved


def test_recovery_decision_is_deterministic() -> None:
    error = _error(
        ErrorCode.SYSTEM_STORAGE_FAILURE,
        ErrorFamily.SYSTEM,
        ThresholdLayer.FORCE,
    )
    context = RecoveryContext(max_retries=1)

    first = recover(error, _checkpoint(), context)
    second = recover(error, _checkpoint(), context)

    assert first == second
    assert first.action is RecoveryAction.RETRY
    assert not hasattr(first, "topology_operations")


def test_transient_storage_failure_retries_once_from_checkpoint() -> None:
    decision = recover(
        _error(
            ErrorCode.SYSTEM_STORAGE_FAILURE,
            ErrorFamily.SYSTEM,
            ThresholdLayer.FORCE,
        ),
        _checkpoint(),
        RecoveryContext(max_retries=1),
    )

    assert decision.action is RecoveryAction.RETRY
    assert decision.retry_allowed
    assert decision.retry_count == 1
    assert decision.resume_from is ThresholdLayer.FORCE


def test_transient_failure_retry_is_bounded() -> None:
    error = _error(
        ErrorCode.SYSTEM_STORAGE_FAILURE,
        ErrorFamily.SYSTEM,
        ThresholdLayer.FORCE,
    )

    exhausted = recover(
        error,
        _checkpoint(),
        RecoveryContext(max_retries=1, retry_count=1),
    )

    assert exhausted.action is RecoveryAction.ABORT_EVALUATION
    assert not exhausted.retry_allowed


def test_missing_current_force_is_not_synthesized_as_zero() -> None:
    decision = recover(
        _error(
            ErrorCode.PHYSICS_MISSING_CURRENT_FORCE,
            ErrorFamily.PHYSICS,
            ThresholdLayer.PHYSICS,
        ),
        _checkpoint(),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.ABORT_EVALUATION
    assert not hasattr(decision, "force")
    assert not hasattr(decision, "effective_vector")


def test_rebuild_from_same_checkpoint_is_deterministic() -> None:
    checkpoint = DerivedState(sequence=10, total=0.25)
    history = (0.10, 0.20, -0.05)

    first = _replay(checkpoint, history)
    second = _replay(checkpoint, history)

    assert first == second == DerivedState(sequence=13, total=0.5)
    assert checkpoint == DerivedState(sequence=10, total=0.25)


def test_rebuildable_derived_state_uses_authoritative_checkpoint() -> None:
    decision = recover(
        _error(
            ErrorCode.CONTRACT_OUTPUT_INVALID,
            ErrorFamily.CONTRACT,
            ThresholdLayer.PRESSURE,
        ),
        _checkpoint(ThresholdLayer.PRESSURE),
        RecoveryContext(
            derived_state_rebuildable=True,
            authoritative_checkpoint_valid=True,
        ),
    )

    assert decision.action is RecoveryAction.REBUILD_DERIVED_STATE
    assert decision.resume_from is ThresholdLayer.PRESSURE
    assert decision.authoritative_state_preserved


def test_local_integrity_failure_can_quarantine_branch() -> None:
    decision = recover(
        _error(
            ErrorCode.CONTRACT_OUTPUT_INVALID,
            ErrorFamily.CONTRACT,
            ThresholdLayer.STRUCTURE,
        ),
        _checkpoint(ThresholdLayer.STRUCTURE),
        RecoveryContext(affected_subject_isolatable=True),
    )

    assert decision.action is RecoveryAction.QUARANTINE
    assert decision.authoritative_state_preserved
    assert decision.action is not RecoveryAction.HALT_WORLD


def test_quarantine_does_not_mutate_topology_or_lifecycle() -> None:
    decision = recover(
        _error(
            ErrorCode.PHYSICS_INVALID_MASS,
            ErrorFamily.PHYSICS,
            ThresholdLayer.PHYSICS,
        ),
        _checkpoint(),
        RecoveryContext(affected_subject_isolatable=True),
    )

    assert decision.action is RecoveryAction.QUARANTINE
    assert decision.authoritative_state_preserved
    assert not hasattr(decision, "lifecycle")
    assert not hasattr(decision, "flower_id")


def test_failed_topology_transaction_is_atomic() -> None:
    node = TopologicalNode("node-a", "flower-a", 1, NodeLifecycle.ACTIVE)
    flower = FlowerTopology("flower-a", (1,), ("node-a",))
    prior = TopologyState(0, 0, (node,), (), (flower,))
    collapse = StructuralProposal(
        "proposal:collapse",
        ProposalType.COLLAPSE_CANDIDATE,
        "node-a",
        .9,
        3,
        ("evidence-1",),
        1,
    )
    structural = StructuralResult(
        "node-a",
        1,
        1,
        StructuralRegime.STABLE,
        (),
        (),
        (collapse,),
        None,
    )

    result = evaluate_topology(prior, (structural,), TopologyContext(0, 1))

    assert not result.committed
    assert result.resulting_state == prior
    assert not result.events


def test_committed_topology_history_is_append_only() -> None:
    node = TopologicalNode("node-a", "flower-a", 1, NodeLifecycle.ACTIVE)
    relationship = Relationship(
        "relationship-a",
        "node-a",
        "node-b",
        RelationshipKind.ORDINARY,
        0.5,
        0,
        0,
    )
    prior = TopologyState(
        3,
        1,
        (node, TopologicalNode("node-b", "flower-a", 1, NodeLifecycle.ACTIVE)),
        (relationship,),
        (FlowerTopology("flower-a", (1,), ("node-a", "node-b")),),
        ("event:already-committed",),
    )
    anchor = StructuralProposal(
        "proposal:anchor",
        ProposalType.STRENGTHEN_TO_ANCHOR,
        "node-a",
        .9,
        3,
        ("evidence-1",),
        2,
        relationship_id="relationship-a",
        target_id="node-b",
    )
    structural = StructuralResult(
        "node-a",
        1,
        2,
        StructuralRegime.STABLE,
        (),
        (),
        (anchor,),
        None,
    )
    committed = evaluate_topology(prior, (structural,), TopologyContext(3, 2))

    assert committed.committed
    assert committed.resulting_state.committed_event_ids[:1] == prior.committed_event_ids
    assert len(committed.resulting_state.committed_event_ids) == 2


def test_downstream_recovery_cannot_rewrite_upstream_cause() -> None:
    """A desired downstream outcome cannot rewrite the causal inputs."""
    decision = recover(
        _error(
            ErrorCode.FORCE_INVALID_DIRECTION,
            ErrorFamily.FORCE,
            ThresholdLayer.FORCE,
        ),
        _checkpoint(ThresholdLayer.FORCE),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.ABORT_EVALUATION
    forbidden = {
        "mirror_output",
        "demand",
        "pressure",
        "force",
        "position",
        "velocity",
        "topology_operations",
    }
    assert forbidden.isdisjoint(RecoveryDecision.__dataclass_fields__)


def test_untrustworthy_authoritative_state_halts_world() -> None:
    """Authoritative contradiction halts advancement rather than guessing."""
    decision = recover(
        _error(
            ErrorCode.CONSISTENCY_CONTRADICTORY_AUTHORITY,
            ErrorFamily.CONSISTENCY,
            ThresholdLayer.TOPOLOGY,
            severity=ErrorSeverity.FATAL,
            disposition=ErrorDisposition.HALT_WORLD,
        ),
        _checkpoint(ThresholdLayer.TOPOLOGY),
        RecoveryContext(authoritative_integrity_compromised=True),
    )

    assert decision.action is RecoveryAction.HALT_WORLD
    assert not decision.retry_allowed
    assert not decision.authoritative_state_preserved


def test_partial_authoritative_transaction_halts_world() -> None:
    decision = recover(
        _error(
            ErrorCode.CONSISTENCY_PARTIAL_TRANSACTION,
            ErrorFamily.CONSISTENCY,
            ThresholdLayer.TOPOLOGY,
            severity=ErrorSeverity.FATAL,
            disposition=ErrorDisposition.HALT_WORLD,
        ),
        _checkpoint(ThresholdLayer.TOPOLOGY),
        RecoveryContext(),
    )

    assert decision.action is RecoveryAction.HALT_WORLD
    assert not decision.authoritative_state_preserved
