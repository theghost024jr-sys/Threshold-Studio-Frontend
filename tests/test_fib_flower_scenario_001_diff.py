from __future__ import annotations

from dataclasses import dataclass

import pytest
from engine.circuit_mirror import (
    CircuitMirrorConfig,
    CircuitMirrorSignal,
    CircuitMirrorState,
    EvidenceSummary,
    MirrorState,
    ReflectionContext,
    reflect_circuit_mirror,
)
from engine.force import (
    DistancePolicy,
    FieldCandidate,
    FieldState,
    ForceContext,
    ForcePolicy,
    ForceState,
    ReorganizationPolicy,
    ResistancePolicy,
    evaluate_force,
)
from engine.node_physics import (
    AccelerationPolicy,
    ConstraintPolicy,
    DampingPolicy,
    MotionClass,
    NodePhysicsContext,
    TimePolicy,
    VelocityPolicy,
    integrate_node,
)
from engine.pressure import (
    PressureAccumulationPolicy,
    PressureCancellationPolicy,
    PressureContext,
    PressureDecayPolicy,
    PressureState,
    evaluate_pressure,
)
from engine.structural import (
    StructuralContext,
    StructuralThresholds,
    StructuralWindows,
    evaluate_structure,
)
from engine.topology import TopologyContext, evaluate_topology
from fixtures.fib_flower_scenarios import FibFlowerScenario001, fib_flower_scenario_001


@dataclass(frozen=True, slots=True)
class Scenario001Trace:
    scenario_name: str
    foreign_source_available: bool
    demand_ids: tuple[str, ...]
    pressure_components: tuple[object, ...]
    pressure_total: float
    force_contributions: tuple[object, ...]
    gross_force: float
    resultant_force: float
    directional_bias: float
    tension: float
    position: tuple[float, float]
    velocity: tuple[float, float]
    displacement: tuple[float, float]
    motion_class: MotionClass
    relationship_updates: tuple[object, ...]
    structural_regime: object
    structural_proposals: tuple[object, ...]
    topology_committed: bool
    topology_events: tuple[object, ...]
    topology_version: int


@dataclass(frozen=True, slots=True)
class Scenario001Diff:
    baseline: Scenario001Trace
    foreign: Scenario001Trace
    pressure_total_delta: float
    gross_force_delta: float
    resultant_force_delta: float
    directional_bias_delta: float
    tension_delta: float
    position_delta: tuple[float, float]
    velocity_delta: tuple[float, float]


@dataclass(frozen=True, slots=True)
class Scenario001SweepPoint:
    foreign_compatibility: float
    trace: Scenario001Trace


class Scenario001ProvenanceError(RuntimeError):
    """A repeated observation cannot be interpreted as persistent identity."""


def _mirror_config() -> CircuitMirrorConfig:
    return CircuitMirrorConfig(.1, .5, .75, .6, .5, .8, .01, .5, .2, .5, 2)


def _structural_context(world_tick: int) -> StructuralContext:
    thresholds = StructuralThresholds(
        .01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0.,
        .01, 1., 1., 1., 1., 1., 1,
    )
    return StructuralContext(world_tick, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2))


def _run_scenario_001(
    scenario_name: str,
    foreign_source_available: bool,
    foreign_compatibility: float = 1.,
) -> Scenario001Trace:
    scenario: FibFlowerScenario001 = fib_flower_scenario_001()
    tick = 1
    evidence = EvidenceSummary(
        ("scenario-001-evidence",),
        ("environment",),
        (scenario.dimension_id,),
        .9,
        .9,
        .9,
        .9,
    )
    mirror = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., evidence, dimension_id=scenario.dimension_id),
        ReflectionContext("scenario-001-reflection-1", scenario.subject_id, 1, tick),
        _mirror_config(),
    )
    pressure = evaluate_pressure(
        prior=PressureState(scenario.subject_id, 0, (), 0., None, None, 0, ()),
        mirror_output=mirror.output,
        context=PressureContext(tick, 1, PressureDecayPolicy(.9), PressureAccumulationPolicy(1., 1.), PressureCancellationPolicy()),
    )
    candidates = [
        FieldCandidate(
            scenario.internal_source_id,
            scenario.dimension_id,
            scenario.field_nodes[scenario.internal_source_id].position,
            .75,
            1.,
            1.,
        ),
    ]
    if foreign_source_available:
        candidates.append(
            FieldCandidate(
                scenario.foreign_source_id,
                scenario.dimension_id,
                scenario.field_nodes[scenario.foreign_source_id].position,
                foreign_compatibility,
                1.,
                1.,
            )
        )
    force = evaluate_force(
        pressure,
        FieldState(tick, tuple(candidates)),
        scenario.field_nodes[scenario.subject_id],
        ForceState(scenario.subject_id, 0, 0),
        ForceContext(tick, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    physics = integrate_node(
        scenario.motion_states[scenario.subject_id],
        force,
        NodePhysicsContext(tick, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), .001, .001, .01),
    )
    structure = evaluate_structure(
        scenario.subject_id,
        pressure,
        force,
        physics,
        scenario.flower_a_state,
        scenario.subject_structure,
        _structural_context(tick),
    )
    topology = evaluate_topology(
        scenario.topology,
        (structure,),
        TopologyContext(scenario.topology.version, tick),
    )
    return Scenario001Trace(
        scenario_name,
        foreign_source_available,
        tuple(contribution.demand_id for contribution in pressure.added),
        pressure.components,
        pressure.resulting_total,
        force.contributions,
        force.gross_force,
        force.resultant_magnitude,
        force.directional_bias,
        force.tension,
        physics.position,
        physics.velocity,
        physics.actual_displacement,
        physics.motion_class,
        structure.relationship_updates,
        structure.regime,
        structure.proposals,
        topology.committed,
        topology.events,
        topology.resulting_state.version,
    )


def run_scenario_001_diff() -> Scenario001Diff:
    baseline = _run_scenario_001("001A", False)
    foreign = _run_scenario_001("001B", True)
    return Scenario001Diff(
        baseline,
        foreign,
        foreign.pressure_total - baseline.pressure_total,
        foreign.gross_force - baseline.gross_force,
        foreign.resultant_force - baseline.resultant_force,
        foreign.directional_bias - baseline.directional_bias,
        foreign.tension - baseline.tension,
        (foreign.position[0] - baseline.position[0], foreign.position[1] - baseline.position[1]),
        (foreign.velocity[0] - baseline.velocity[0], foreign.velocity[1] - baseline.velocity[1]),
    )


def run_scenario_001_strength_sweep(
    strengths: tuple[float, ...] = (0., .25, .5, .75, 1.),
) -> tuple[Scenario001SweepPoint, ...]:
    return tuple(
        Scenario001SweepPoint(
            strength,
            _run_scenario_001(
                f"001-strength-{strength:.2f}",
                foreign_source_available=True,
                foreign_compatibility=strength,
            ),
        )
        for strength in strengths
    )


def _require_persistent_demand_lineage() -> None:
    scenario = fib_flower_scenario_001()
    initial = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., EvidenceSummary(("lineage-evidence",), ("environment",), (scenario.dimension_id,), .9, .9, .9, .9), dimension_id=scenario.dimension_id),
        ReflectionContext("scenario-001-lineage-1", scenario.subject_id, 1, 1),
        _mirror_config(),
    )
    successor = reflect_circuit_mirror(
        initial.next_state,
        CircuitMirrorSignal(.8, .6, .7, .3, 0., EvidenceSummary(("lineage-evidence",), ("environment",), (scenario.dimension_id,), .9, .9, .9, .9), dimension_id=scenario.dimension_id),
        ReflectionContext("scenario-001-lineage-2", scenario.subject_id, 2, 2),
        _mirror_config(),
    )
    assert initial.output.demand is not None
    assert successor.output.demand is not None
    if successor.output.demand.demand_id != initial.output.demand.demand_id:
        raise Scenario001ProvenanceError(
            "Tick 1 established "
            f"{initial.output.demand.demand_id}; tick 2 produced "
            f"{successor.output.demand.demand_id} without explicit lineage."
        )


def test_scenario_001_a_b_diff_varies_only_foreign_availability() -> None:
    result = run_scenario_001_diff()
    baseline = result.baseline
    foreign = result.foreign

    assert not baseline.foreign_source_available
    assert foreign.foreign_source_available
    assert baseline.demand_ids == foreign.demand_ids
    assert baseline.demand_ids
    assert baseline.pressure_components == foreign.pressure_components
    assert baseline.pressure_total == foreign.pressure_total
    assert result.pressure_total_delta == 0.
    assert {contribution.target_id for contribution in baseline.force_contributions} == {"A4"}
    assert {contribution.target_id for contribution in foreign.force_contributions} == {"A4", "B1"}
    assert baseline.motion_class is not MotionClass.RESTING
    assert foreign.motion_class is not MotionClass.RESTING


def test_scenario_001_diff_reports_measurements_without_prescribing_outcomes() -> None:
    result = run_scenario_001_diff()

    assert all(
        isinstance(delta, float)
        for delta in (
            result.gross_force_delta,
            result.resultant_force_delta,
            result.directional_bias_delta,
            result.tension_delta,
        )
    )
    assert len(result.position_delta) == 2
    assert len(result.velocity_delta) == 2
    assert result.baseline.scenario_name == "001A"
    assert result.foreign.scenario_name == "001B"


def test_scenario_001_b1_strength_sweep_retains_causal_inputs() -> None:
    sweep = run_scenario_001_strength_sweep()

    assert tuple(point.foreign_compatibility for point in sweep) == (0., .25, .5, .75, 1.)
    assert len({point.trace.demand_ids for point in sweep}) == 1
    assert len({point.trace.pressure_total for point in sweep}) == 1
    assert len({point.trace.pressure_components for point in sweep}) == 1
    assert {contribution.target_id for contribution in sweep[0].trace.force_contributions} == {"A4"}
    assert all(
        {contribution.target_id for contribution in point.trace.force_contributions}
        == {"A4", "B1"}
        for point in sweep[1:]
    )


def test_repeated_observation_does_not_establish_persistent_identity() -> None:
    with pytest.raises(Scenario001ProvenanceError, match="without explicit lineage"):
        _require_persistent_demand_lineage()
