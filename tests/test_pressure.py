from math import exp

import pytest

from engine.circuit_mirror import (
    CircuitMirrorConfig,
    CircuitMirrorSignal,
    CircuitMirrorState,
    EvidenceSummary,
    MirrorOutput,
    MirrorState,
    MirrorTransition,
    ReflectionClass,
    ReflectionContext,
    reflect_circuit_mirror,
)
from engine.pressure import (
    PressureAccumulationPolicy,
    PressureCancellationPolicy,
    PressureComponent,
    PressureContext,
    PressureDecayPolicy,
    PressurePolarity,
    PressureState,
    evaluate_pressure,
)


@pytest.fixture
def mirror_config() -> CircuitMirrorConfig:
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


def _evidence() -> EvidenceSummary:
    return EvidenceSummary(
        evidence_ids=("evidence-1",),
        source_nodes=("node-source",),
        observed_dimensions=("signal",),
        integrity=0.9,
        relevance=0.9,
        freshness=0.9,
        comparability=0.9,
    )


def _mirror_output(
    *,
    sequence: int,
    state: CircuitMirrorState,
    signal: CircuitMirrorSignal,
    config: CircuitMirrorConfig,
):
    return reflect_circuit_mirror(
        state,
        signal,
        ReflectionContext(f"reflection-{sequence}", "node-a", sequence, sequence),
        config,
    )


def _pressure_state() -> PressureState:
    return PressureState(
        node_id="node-a",
        sequence=0,
        components=(),
        total=0.0,
        dominant_dimension=None,
        accumulated_since=None,
        last_evaluated_at=0,
        source_demands=(),
    )


def _context(tick: int, elapsed: int) -> PressureContext:
    return PressureContext(
        world_tick=tick,
        elapsed_ticks=elapsed,
        decay_policy=PressureDecayPolicy(retention_per_tick=0.9),
        accumulation_policy=PressureAccumulationPolicy(
            contribution_gain=1.0,
            resolution_relief_gain=1.0,
        ),
        cancellation_policy=PressureCancellationPolicy(),
    )


def test_unresolved_demand_accumulates_provenance_bearing_pressure(
    mirror_config: CircuitMirrorConfig,
) -> None:
    reflection = _mirror_output(
        sequence=1,
        state=CircuitMirrorState(
            state=MirrorState.SEEKING,
            resonance=0.6,
            deficit=0.8,
            coherence=0.7,
            phase=0.2,
            evidence=0.4,
        ),
        signal=CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config=mirror_config,
    )

    result = evaluate_pressure(
        prior=_pressure_state(),
        mirror_output=reflection.output,
        context=_context(1, 1),
    )

    assert result.resulting_total > 0.0
    assert result.added[0].demand_id == reflection.output.demand.demand_id
    assert result.components[0].polarity is PressurePolarity.ATTRACTIVE
    assert result.resulting_state.source_demands == (reflection.output.demand.demand_id,)


def test_pressure_uses_unbounded_raw_load_with_bounded_saturation(
    mirror_config: CircuitMirrorConfig,
) -> None:
    state = _pressure_state()
    mirror_state = CircuitMirrorState(
        state=MirrorState.SEEKING,
        resonance=0.6,
        deficit=1.0,
        coherence=0.7,
        phase=0.2,
        evidence=0.4,
    )
    signal = CircuitMirrorSignal(1.0, 0.6, 0.7, 0.3, 0.0, _evidence())

    first = evaluate_pressure(
        prior=state,
        mirror_output=_mirror_output(
            sequence=1, state=mirror_state, signal=signal, config=mirror_config
        ).output,
        context=_context(1, 1),
    )
    second = evaluate_pressure(
        prior=first.resulting_state,
        mirror_output=_mirror_output(
            sequence=2, state=mirror_state, signal=signal, config=mirror_config
        ).output,
        context=_context(2, 1),
    )

    assert second.components[0].raw_load > first.components[0].raw_load
    assert second.components[0].persistence > first.components[0].persistence
    assert second.components[0].confidence > first.components[0].confidence
    assert 0.0 < second.resulting_total < 1.0


def test_resolution_actively_relieves_matching_pressure_components(
    mirror_config: CircuitMirrorConfig,
) -> None:
    unresolved = _mirror_output(
        sequence=1,
        state=CircuitMirrorState(
            state=MirrorState.SEEKING,
            resonance=0.6,
            deficit=0.8,
            coherence=0.7,
            phase=0.2,
            evidence=0.4,
        ),
        signal=CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config=mirror_config,
    )
    pressured = evaluate_pressure(
        prior=_pressure_state(),
        mirror_output=unresolved.output,
        context=_context(1, 1),
    )
    resolution = _mirror_output(
        sequence=2,
        state=unresolved.next_state,
        signal=CircuitMirrorSignal(1.0, 0.6, 0.7, 0.2, 1.0, _evidence()),
        config=mirror_config,
    )

    result = evaluate_pressure(
        prior=pressured.resulting_state,
        mirror_output=resolution.output,
        context=_context(2, 1),
    )

    assert result.relieved
    assert result.resulting_total < pressured.resulting_total
    assert result.relieved[0].resolved_demand_ids == pressured.resulting_state.source_demands
    assert result.resulting_state.source_demands == pressured.resulting_state.source_demands


def test_insufficient_output_does_not_create_relief_or_pressure(
    mirror_config: CircuitMirrorConfig,
) -> None:
    output = _mirror_output(
        sequence=1,
        state=CircuitMirrorState(
            state=MirrorState.COHERENT,
            resonance=0.6,
            deficit=0.0,
            coherence=0.7,
            phase=0.2,
            evidence=0.4,
        ),
        signal=CircuitMirrorSignal(
            0.8,
            0.6,
            0.7,
            0.2,
            0.0,
            EvidenceSummary(
                evidence_ids=("degraded",),
                source_nodes=("node-source",),
                observed_dimensions=("signal",),
                integrity=0.1,
                relevance=0.1,
                freshness=0.1,
                comparability=0.1,
            ),
        ),
        config=mirror_config,
    )

    result = evaluate_pressure(
        prior=_pressure_state(),
        mirror_output=output.output,
        context=_context(1, 1),
    )

    assert not result.added
    assert not result.relieved
    assert result.resulting_total == 0.0


def test_opposing_polarities_remain_separate_pressure_components(
    mirror_config: CircuitMirrorConfig,
) -> None:
    attracting = _mirror_output(
        sequence=1,
        state=CircuitMirrorState(
            state=MirrorState.SEEKING,
            resonance=0.6,
            deficit=0.8,
            coherence=0.7,
            phase=0.2,
            evidence=0.4,
        ),
        signal=CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config=mirror_config,
    )
    first = evaluate_pressure(
        prior=_pressure_state(),
        mirror_output=attracting.output,
        context=_context(1, 1),
    )
    reorganizing = _mirror_output(
        sequence=2,
        state=CircuitMirrorState(
            state=MirrorState.DISSONANT,
            resonance=0.6,
            deficit=0.7,
            coherence=0.6,
            phase=0.0,
            evidence=0.5,
            claim_ids=("claim-a",),
        ),
        signal=CircuitMirrorSignal(0.8, 0.6, 0.7, 0.5, 0.0, _evidence(), 0.9),
        config=mirror_config,
    )

    result = evaluate_pressure(
        prior=first.resulting_state,
        mirror_output=reorganizing.output,
        context=_context(2, 1),
    )

    assert {component.polarity for component in result.components} == {
        PressurePolarity.ATTRACTIVE,
        PressurePolarity.REORGANIZATIONAL,
    }


def test_explicit_cancellation_can_only_reduce_configured_opposites(
) -> None:
    attractive = PressureComponent(
        dimension_id="signal",
        raw_load=1.0,
        magnitude=1.0 - exp(-1.0),
        polarity=PressurePolarity.ATTRACTIVE,
        persistence=0.8,
        confidence=0.9,
        source_demands=("demand-attract",),
    )
    repulsive = PressureComponent(
        dimension_id="signal",
        raw_load=1.0,
        magnitude=1.0 - exp(-1.0),
        polarity=PressurePolarity.REPULSIVE,
        persistence=0.8,
        confidence=0.9,
        source_demands=("demand-repel",),
    )
    prior = PressureState(
        node_id="node-a",
        sequence=1,
        components=(attractive, repulsive),
        total=1.0 - exp(-2.0),
        dominant_dimension="signal",
        accumulated_since=1,
        last_evaluated_at=1,
        source_demands=("demand-attract", "demand-repel"),
    )
    output = MirrorOutput(
        reflection_id="reflection-2",
        node_id="node-a",
        sequence=2,
        prior_state=MirrorState.COHERENT,
        resulting_state=MirrorState.COHERENT,
        transition=MirrorTransition.NONE,
        classification=ReflectionClass.NO_EFFECT,
        evidence=_evidence(),
        discrepancy=None,
        demand=None,
        resonance=0.0,
        coherence_delta=0.0,
        contradiction=0.0,
        novelty=0.0,
        confidence=0.9,
        model_revision=None,
        unresolved=False,
        emitted_at=2,
    )
    result = evaluate_pressure(
        prior=prior,
        mirror_output=output,
        context=PressureContext(
            world_tick=2,
            elapsed_ticks=1,
            decay_policy=PressureDecayPolicy(retention_per_tick=1.0),
            accumulation_policy=PressureAccumulationPolicy(
                contribution_gain=1.0,
                resolution_relief_gain=1.0,
            ),
            cancellation_policy=PressureCancellationPolicy(
                cancellable_dimensions=("signal",),
                cancellation_fraction=0.5,
            ),
        ),
    )

    assert {component.polarity for component in result.components} == {
        PressurePolarity.ATTRACTIVE,
        PressurePolarity.REPULSIVE,
    }
    assert {component.raw_load for component in result.components} == {0.5}


def test_pressure_rejects_stale_output(mirror_config: CircuitMirrorConfig) -> None:
    reflection = _mirror_output(
        sequence=1,
        state=CircuitMirrorState(
            state=MirrorState.SEEKING,
            resonance=0.6,
            deficit=0.8,
            coherence=0.7,
            phase=0.2,
            evidence=0.4,
        ),
        signal=CircuitMirrorSignal(0.8, 0.6, 0.7, 0.3, 0.0, _evidence()),
        config=mirror_config,
    )
    result = evaluate_pressure(
        prior=_pressure_state(),
        mirror_output=reflection.output,
        context=_context(1, 1),
    )

    with pytest.raises(ValueError, match="stale"):
        evaluate_pressure(
            prior=result.resulting_state,
            mirror_output=reflection.output,
            context=_context(1, 0),
        )
