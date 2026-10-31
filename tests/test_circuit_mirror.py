from dataclasses import replace

import pytest

from engine.circuit_mirror import (
    CircuitMirrorConfig,
    CircuitMirrorSignal,
    CircuitMirrorState,
    DemandLineage,
    DemandLineageRelation,
    DemandPolarity,
    EvidenceSummary,
    MirrorState,
    MirrorTransition,
    ReflectionClass,
    ReflectionContext,
    reflect_circuit_mirror,
)


@pytest.fixture
def config() -> CircuitMirrorConfig:
    return CircuitMirrorConfig(
        noise_threshold=0.1,
        evidence_threshold=0.5,
        resonance_threshold=0.75,
        contradiction_threshold=0.6,
        resolution_threshold=0.5,
        inversion_threshold=0.8,
        resolution_epsilon=0.01,
        evidence_gain=0.5,
        coherence_gain=0.2,
        phase_reorientation_gain=0.5,
        fracture_threshold=2,
    )


def _state(state: MirrorState = MirrorState.DORMANT, **changes: object) -> CircuitMirrorState:
    values = {
        "state": state,
        "resonance": 0.6,
        "deficit": 0.0,
        "coherence": 0.7,
        "phase": 0.2,
        "evidence": 0.0,
    }
    values.update(changes)
    return CircuitMirrorState(**values)


def _evidence(*, evidence_ids: tuple[str, ...] = ("evidence-1",), support: float = 0.9) -> EvidenceSummary:
    return EvidenceSummary(
        evidence_ids=evidence_ids,
        source_nodes=("node-source",),
        observed_dimensions=("signal",),
        integrity=support,
        relevance=support,
        freshness=support,
        comparability=support,
    )


def _reflect(
    state: CircuitMirrorState,
    signal: CircuitMirrorSignal,
    config: CircuitMirrorConfig,
    sequence: int = 1,
):
    return reflect_circuit_mirror(
        state,
        signal,
        ReflectionContext(f"reflection-{sequence}", "node-a", sequence, 5400 + sequence),
        config,
    )


def test_insufficient_evidence_is_an_honest_no_vote(config: CircuitMirrorConfig) -> None:
    state = _state(MirrorState.COHERENT)

    result = _reflect(
        state,
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.2, 0.0, _evidence(support=0.4)),
        config,
    )

    assert result.next_state == state
    assert result.output.classification is ReflectionClass.INSUFFICIENT
    assert result.output.discrepancy is None
    assert result.output.demand is None
    assert result.output.confidence == 0.0


def test_noise_preserves_the_persistent_state(config: CircuitMirrorConfig) -> None:
    state = _state(MirrorState.SEEKING, deficit=0.4, evidence=0.3)

    result = _reflect(
        state,
        CircuitMirrorSignal(0.1, 0.0, 0.0, 0.0, 0.0, _evidence()),
        config,
    )

    assert result.next_state == state
    assert result.output.classification is ReflectionClass.NOISE
    assert result.output.demand is None


def test_novel_evidence_awakens_a_dormant_mirror(config: CircuitMirrorConfig) -> None:
    result = _reflect(
        _state(),
        CircuitMirrorSignal(0.8, 0.0, 0.0, 0.6, 0.0, _evidence()),
        config,
    )

    assert result.output.transition is MirrorTransition.AWAKENED
    assert result.output.classification is ReflectionClass.NOVEL
    assert result.next_state.state is MirrorState.SEEKING
    assert result.output.demand is not None
    assert result.output.unresolved


def test_compatible_evidence_exposes_demand_without_physical_authority(
    config: CircuitMirrorConfig,
) -> None:
    result = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8, evidence=0.4),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )

    assert result.output.classification is ReflectionClass.COMPATIBLE
    assert result.next_state.state is MirrorState.RESONANT
    assert result.output.demand is not None
    assert result.output.demand.polarity is DemandPolarity.ATTRACT
    assert not hasattr(result.output, "pressure")


def test_resolution_reports_delta_and_clears_demand(config: CircuitMirrorConfig) -> None:
    result = _reflect(
        _state(MirrorState.RESONANT, deficit=0.4, evidence=0.4),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.2, 0.8, _evidence()),
        config,
    )

    assert result.output.transition is MirrorTransition.RESOLUTION_ACHIEVED
    assert result.output.classification is ReflectionClass.RESOLVING
    assert result.next_state.state is MirrorState.COHERENT
    assert result.output.coherence_delta > 0.0
    assert result.output.demand is None
    assert not result.output.unresolved


def test_fracture_holds_unresolved_contradiction_without_demand(
    config: CircuitMirrorConfig,
) -> None:
    state = _state(MirrorState.SEEKING, deficit=0.2, coherence=0.9)
    contradiction = CircuitMirrorSignal(1.0, 0.0, 0.0, 0.7, 0.0, _evidence())

    first = _reflect(state, contradiction, config)
    second = _reflect(first.next_state, contradiction, config, sequence=2)

    assert first.next_state.state is MirrorState.DISSONANT
    assert second.next_state.state is MirrorState.FRACTURED
    assert second.output.transition is MirrorTransition.FRACTURE_DETECTED
    assert second.output.contradiction > 0.0
    assert second.output.demand is None
    assert second.output.unresolved


def test_inversion_preserves_auditable_model_revision(config: CircuitMirrorConfig) -> None:
    state = _state(
        MirrorState.DISSONANT,
        deficit=0.7,
        phase=0.0,
        evidence=0.6,
        contradiction_streak=1,
        claim_ids=("claim-a",),
        active_demand_id="demand-old",
    )

    result = _reflect(
        state,
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.5, 0.0, _evidence(), 0.9),
        config,
    )

    assert result.output.transition is MirrorTransition.MODEL_REVISED
    assert result.output.model_revision is not None
    assert result.output.model_revision.removed_claims == ("claim-a",)
    assert result.output.model_revision.superseded_demand_ids == ("demand-old",)
    assert result.output.demand is not None
    assert result.output.demand.polarity is DemandPolarity.REORGANIZE


def test_output_rejects_a_demand_without_a_discrepancy(config: CircuitMirrorConfig) -> None:
    result = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )

    with pytest.raises(ValueError, match="demand requires a discrepancy"):
        type(result.output)(
            **{
                field: getattr(result.output, field)
                for field in result.output.__dataclass_fields__
                if field != "discrepancy"
            },
            discrepancy=None,
        )


def test_initial_demand_has_no_lineage(config: CircuitMirrorConfig) -> None:
    result = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )

    assert result.output.demand is not None
    assert result.output.demand_lineage is None


@pytest.mark.parametrize(
    "relation",
    (
        DemandLineageRelation.PERSISTS,
        DemandLineageRelation.REFINES,
        DemandLineageRelation.SUPERSEDES,
        DemandLineageRelation.UNRELATED,
    ),
)
def test_output_accepts_evidence_backed_active_demand_lineage(
    config: CircuitMirrorConfig,
    relation: DemandLineageRelation,
) -> None:
    result = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )
    assert result.output.demand is not None

    lineage = DemandLineage(
        predecessor_demand_id=(
            result.output.demand.demand_id
            if relation is DemandLineageRelation.PERSISTS
            else "demand-prior"
        ),
        successor_demand_id=result.output.demand.demand_id,
        relation=relation,
        evidence_ids=result.output.evidence.evidence_ids,
        reflection_id=result.output.reflection_id,
    )

    output = replace(result.output, demand_lineage=lineage)

    assert output.demand_lineage is lineage


@pytest.mark.parametrize(
    "lineage",
    (
        DemandLineage("demand-prior", "demand-other", DemandLineageRelation.REFINES, ("evidence-1",), "reflection-1"),
        DemandLineage("demand-prior", "demand:reflection-1", DemandLineageRelation.REFINES, ("evidence-other",), "reflection-1"),
        DemandLineage("demand-prior", "demand:reflection-1", DemandLineageRelation.REFINES, ("evidence-1",), "reflection-other"),
    ),
)
def test_output_rejects_unbacked_or_mismatched_demand_lineage(
    config: CircuitMirrorConfig,
    lineage: DemandLineage,
) -> None:
    result = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )

    with pytest.raises(ValueError):
        replace(result.output, demand_lineage=lineage)


def test_resolution_lineage_requires_terminal_output(config: CircuitMirrorConfig) -> None:
    result = _reflect(
        _state(MirrorState.RESONANT, deficit=0.4, evidence=0.4),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.2, 0.8, _evidence()),
        config,
    )
    lineage = DemandLineage(
        predecessor_demand_id="demand-prior",
        successor_demand_id=None,
        relation=DemandLineageRelation.RESOLVES,
        evidence_ids=result.output.evidence.evidence_ids,
        reflection_id=result.output.reflection_id,
    )

    output = replace(result.output, demand_lineage=lineage)

    assert output.demand is None
    assert output.demand_lineage is lineage


def test_resolution_transition_rejects_non_resolving_lineage(config: CircuitMirrorConfig) -> None:
    resolution = _reflect(
        _state(MirrorState.RESONANT, deficit=0.4, evidence=0.4),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.2, 0.8, _evidence()),
        config,
    )
    active = _reflect(
        _state(MirrorState.SEEKING, deficit=0.8),
        CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config,
    )
    assert active.output.demand is not None
    lineage = DemandLineage(
        predecessor_demand_id=active.output.demand.demand_id,
        successor_demand_id=active.output.demand.demand_id,
        relation=DemandLineageRelation.PERSISTS,
        evidence_ids=resolution.output.evidence.evidence_ids,
        reflection_id=resolution.output.reflection_id,
    )

    with pytest.raises(ValueError, match="resolution transition may only carry RESOLVES lineage"):
        replace(resolution.output, demand=active.output.demand, unresolved=True, demand_lineage=lineage)
