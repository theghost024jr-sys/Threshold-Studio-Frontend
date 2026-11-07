from math import exp

import pytest

from engine.force import (
    DistancePolicy,
    FieldCandidate,
    FieldState,
    ForceContext,
    ForcePolicy,
    ForceState,
    NodeFieldState,
    ReorganizationPolicy,
    ResistancePolicy,
    UndirectedLoadReason,
    evaluate_force,
)
from engine.pressure import (
    PressureComponent,
    PressurePolarity,
    PressureResult,
    PressureState,
)


def _component(polarity: PressurePolarity) -> PressureComponent:
    return PressureComponent(
        dimension_id="connection",
        raw_load=1.0,
        magnitude=1.0 - exp(-1.0),
        polarity=polarity,
        persistence=0.8,
        confidence=0.9,
        source_demands=(f"demand-{polarity.value}",),
    )


def _pressure(*components: PressureComponent, sequence: int = 1) -> PressureResult:
    total_raw = sum(component.raw_load for component in components)
    state = PressureState(
        node_id="node-a",
        sequence=sequence,
        components=components,
        total=1.0 - exp(-total_raw),
        dominant_dimension="connection" if components else None,
        accumulated_since=1 if components else None,
        last_evaluated_at=1,
        source_demands=tuple(
            demand
            for component in components
            for demand in component.source_demands
        ),
    )
    return PressureResult(
        node_id="node-a",
        sequence=sequence,
        prior_total=0.0,
        resulting_total=state.total,
        delta=state.total,
        components=components,
        added=(),
        relieved=(),
        decayed=(),
        dominant_dimension=state.dominant_dimension,
        trend="rising",
        resulting_state=state,
    )


def _context(resistance: float = 0.0) -> ForceContext:
    return ForceContext(
        world_tick=1,
        distance_policy=DistancePolicy(decay_per_unit=0.0),
        force_policy=ForcePolicy(maximum_magnitude=1.0),
        reorganization_policy=ReorganizationPolicy(),
        resistance_policy=ResistancePolicy(maximum_fraction=resistance),
    )


def _evaluate(pressure: PressureResult, candidates: tuple[FieldCandidate, ...], resistance: float = 0.0):
    return evaluate_force(
        pressure,
        FieldState(world_tick=1, candidates=candidates),
        NodeFieldState(node_id="node-a", position=(0.0, 0.0)),
        ForceState(node_id="node-a", pressure_sequence=0, world_tick=0),
        _context(resistance),
    )


def test_pressure_without_a_field_target_remains_undirected() -> None:
    pressure = _pressure(_component(PressurePolarity.ATTRACTIVE))
    result = _evaluate(pressure, ())

    assert result.gross_force == 0.0
    assert result.resultant_magnitude == 0.0
    assert result.undirected_load[0].reason is UndirectedLoadReason.NO_FIELD_TARGET
    assert pressure.resulting_total > 0.0
    assert not hasattr(result, "synthetic_zero_force")


def test_zero_pressure_cannot_produce_pressure_derived_force() -> None:
    result = _evaluate(
        _pressure(),
        (
            FieldCandidate(
                entity_id="target",
                dimension_id="connection",
                position=(1.0, 0.0),
                compatibility=1.0,
                field_strength=1.0,
                availability=1.0,
            ),
        ),
    )

    assert result.gross_force == 0.0
    assert result.effective_magnitude == 0.0


def test_attractive_pressure_uses_field_geometry_for_direction() -> None:
    result = _evaluate(
        _pressure(_component(PressurePolarity.ATTRACTIVE)),
        (
            FieldCandidate(
                entity_id="target",
                dimension_id="connection",
                position=(1.0, 0.0),
                compatibility=1.0,
                field_strength=1.0,
                availability=1.0,
            ),
        ),
    )

    assert result.resultant_vector[0] > 0.0
    assert result.directional_bias == pytest.approx(1.0)
    assert result.tension == pytest.approx(0.0)


def test_opposing_force_has_tension_without_resultant_motion() -> None:
    result = _evaluate(
        _pressure(
            _component(PressurePolarity.ATTRACTIVE),
            _component(PressurePolarity.REPULSIVE),
        ),
        (
            FieldCandidate(
                entity_id="target",
                dimension_id="connection",
                position=(1.0, 0.0),
                compatibility=1.0,
                field_strength=1.0,
                availability=1.0,
            ),
        ),
    )

    assert result.gross_force > 0.0
    assert result.resultant_magnitude == pytest.approx(0.0)
    assert result.directional_bias == pytest.approx(0.0)
    assert result.tension == pytest.approx(result.gross_force)


def test_resistance_reduces_but_never_reverses_force() -> None:
    result = _evaluate(
        _pressure(_component(PressurePolarity.ATTRACTIVE)),
        (
            FieldCandidate(
                entity_id="target",
                dimension_id="connection",
                position=(1.0, 0.0),
                compatibility=1.0,
                field_strength=1.0,
                availability=1.0,
            ),
        ),
        resistance=0.75,
    )

    assert 0.0 < result.effective_magnitude < result.resultant_magnitude
    assert result.effective_vector[0] > 0.0


def test_reorganization_without_explicit_direction_remains_undirected() -> None:
    result = _evaluate(
        _pressure(_component(PressurePolarity.REORGANIZATIONAL)),
        (
            FieldCandidate(
                entity_id="target",
                dimension_id="connection",
                position=(1.0, 0.0),
                compatibility=1.0,
                field_strength=1.0,
                availability=1.0,
            ),
        ),
    )

    assert result.gross_force == 0.0
    assert result.undirected_load[0].reason is (
        UndirectedLoadReason.NO_VALID_REORGANIZATION_DIRECTION
    )
