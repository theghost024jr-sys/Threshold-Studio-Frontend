from dataclasses import dataclass

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
    NodeFieldState,
    ReorganizationPolicy,
    ResistancePolicy,
    evaluate_force,
)
from engine.node_physics import (
    AccelerationPolicy,
    ConstraintPolicy,
    DampingPolicy,
    NodeMotionState,
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
    FlowerState,
    RelationshipState,
    StructuralContext,
    StructuralRegime,
    StructuralState,
    StructuralThresholds,
    StructuralWindows,
    evaluate_structure,
)
from engine.topology import TopologyContext, evaluate_topology
from fixtures.fib_flower_scenarios import FibFlowerScenario001, fib_flower_scenario_001


@dataclass(frozen=True)
class ScenarioTick:
    tick: int
    mirror: object
    pressure: object
    force: object
    physics: object
    structure: object
    topology: object


@dataclass(frozen=True)
class ScenarioComparison:
    internal_trace: tuple[ScenarioTick, ...]
    foreign_trace: tuple[ScenarioTick, ...]
    final_deltas: dict[str, float]


def _mirror_config() -> CircuitMirrorConfig:
    return CircuitMirrorConfig(
        noise_threshold=.1,
        evidence_threshold=.5,
        resonance_threshold=.75,
        contradiction_threshold=.6,
        resolution_threshold=.5,
        inversion_threshold=.8,
        resolution_epsilon=.01,
        evidence_gain=.5,
        coherence_gain=.2,
        phase_reorientation_gain=.5,
        fracture_threshold=2,
    )


def run_scenario_001(
    scenario: FibFlowerScenario001,
    *,
    foreign_source_available: bool,
    foreign_compatibility: float = .95,
    foreign_source_start_tick: int = 3,
) -> tuple[ScenarioTick, ...]:
    mirror_state = CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4)
    pressure_state = PressureState("A6", 0, (), 0., None, None, 0, ())
    force_state = ForceState("A6", 0, 0)
    motion_state = scenario.motion_states[scenario.subject_id]
    structural_state = scenario.subject_structure
    topology_state = scenario.topology
    trace: list[ScenarioTick] = []
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .01, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)

    for tick in range(1, 7):
        evidence = EvidenceSummary(
            (f"evidence-{tick}",),
            (
                (scenario.internal_source_id,)
                if not foreign_source_available or tick < foreign_source_start_tick
                else (scenario.internal_source_id, scenario.foreign_source_id)
            ),
            (scenario.dimension_id,),
            .9,
            .9,
            .9,
            .9,
        )
        mirror = reflect_circuit_mirror(
            mirror_state,
            CircuitMirrorSignal(.8, .6, .7, .3, 0., evidence, dimension_id=scenario.dimension_id),
            ReflectionContext(f"{scenario.subject_id}-reflection-{tick}", scenario.subject_id, tick, tick),
            _mirror_config(),
        )
        pressure = evaluate_pressure(
            prior=pressure_state,
            mirror_output=mirror.output,
            context=PressureContext(tick, 1, PressureDecayPolicy(.9), PressureAccumulationPolicy(1., 1.), PressureCancellationPolicy()),
        )
        candidates = [FieldCandidate(scenario.internal_source_id, scenario.dimension_id, scenario.field_nodes[scenario.internal_source_id].position, .75, .75, 1.)]
        if foreign_source_available and tick >= foreign_source_start_tick:
            candidates.append(FieldCandidate(scenario.foreign_source_id, scenario.dimension_id, scenario.field_nodes[scenario.foreign_source_id].position, foreign_compatibility, 1., 1.))
        field = FieldState(tick, tuple(candidates))
        force = evaluate_force(
            pressure,
            field,
            NodeFieldState(scenario.subject_id, motion_state.position),
            force_state,
            ForceContext(tick, DistancePolicy(.1), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
        )
        physics = integrate_node(
            motion_state,
            force,
            NodePhysicsContext(tick, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), .001, .001, .01),
        )
        structure = evaluate_structure(
            scenario.subject_id,
            pressure,
            force,
            physics,
            scenario.flower_a_state,
            structural_state,
            StructuralContext(tick, thresholds, StructuralWindows(3, 3, 3, 3, 3, 3)),
        )
        topology = evaluate_topology(
            topology_state,
            (structure,),
            TopologyContext(topology_state.version, tick),
        )
        trace.append(ScenarioTick(tick, mirror.output, pressure, force, physics, structure, topology))
        mirror_state = mirror.next_state
        pressure_state = pressure.resulting_state
        force_state = ForceState("A6", force.pressure_sequence, tick)
        motion_state = physics.resulting_state
        structural_state = structure.resulting_state
        topology_state = topology.resulting_state

    return tuple(trace)


def compare_scenario_001(scenario: FibFlowerScenario001) -> ScenarioComparison:
    """Run the internal-only and foreign-available traces from equal worlds."""

    internal_trace = run_scenario_001(scenario, foreign_source_available=False)
    foreign_trace = run_scenario_001(scenario, foreign_source_available=True)
    internal_final = internal_trace[-1]
    foreign_final = foreign_trace[-1]
    internal_relationship = internal_final.structure.relationship_updates[0]
    foreign_relationship = foreign_final.structure.relationship_updates[0]
    return ScenarioComparison(
        internal_trace=internal_trace,
        foreign_trace=foreign_trace,
        final_deltas={
            "pressure": foreign_final.pressure.resulting_total - internal_final.pressure.resulting_total,
            "gross_force": foreign_final.force.gross_force - internal_final.force.gross_force,
            "resultant_force": foreign_final.force.resultant_magnitude - internal_final.force.resultant_magnitude,
            "directional_bias": foreign_final.force.directional_bias - internal_final.force.directional_bias,
            "tension": foreign_final.force.tension - internal_final.force.tension,
            "displacement": foreign_final.physics.distance - internal_final.physics.distance,
            "speed": (
                (foreign_final.physics.velocity[0] ** 2 + foreign_final.physics.velocity[1] ** 2) ** .5
                - (internal_final.physics.velocity[0] ** 2 + internal_final.physics.velocity[1] ** 2) ** .5
            ),
            "a4_a6_strain": foreign_relationship.strain - internal_relationship.strain,
            "a4_a6_strengthening": (
                foreign_relationship.strengthening_streak.total_ticks
                - internal_relationship.strengthening_streak.total_ticks
            ),
        },
    )


def test_scenario_001_initial_world_is_self_consistent() -> None:
    scenario = fib_flower_scenario_001()

    assert scenario.subject_id == "A6"
    assert scenario.internal_source_id == "A4"
    assert scenario.foreign_source_id == "B1"
    assert scenario.field_nodes["A6"].position == (-3.0, 3.0)
    assert scenario.field_nodes["A4"].position == (-2.0, 2.0)
    assert scenario.field_nodes["B1"].position == (-5.0, 4.0)

    flower_a = next(flower for flower in scenario.topology.flowers if flower.flower_id == "flower-a")
    flower_b = next(flower for flower in scenario.topology.flowers if flower.flower_id == "flower-b")
    a6 = next(node for node in scenario.topology.nodes if node.node_id == "A6")

    assert "A6" in flower_a.node_ids
    assert "B1" not in flower_a.node_ids
    assert "B1" in flower_b.node_ids
    assert "A6" not in flower_b.node_ids
    assert a6.flower_id == "flower-a"
    assert a6.lifecycle.name == "ACTIVE"
    assert "relationship-a4-a6" in a6.relationship_ids
    assert not any(
        {relationship.node_a, relationship.node_b} == {"A6", "B1"}
        for relationship in scenario.topology.relationships
    )
    assert scenario.motion_states["A6"].velocity == (0.0, 0.0)


def test_scenario_001_outer_node_is_deterministic_and_causally_traceable() -> None:
    first = run_scenario_001(fib_flower_scenario_001(), foreign_source_available=True)
    second = run_scenario_001(fib_flower_scenario_001(), foreign_source_available=True)

    assert first == second
    assert len(first) == 6
    assert all(tick.mirror.demand is not None for tick in first)
    assert all(tick.pressure.added for tick in first)
    assert all(tick.force.contributions for tick in first)
    assert all(tick.physics.distance > 0. for tick in first)

    for tick in first:
        demand_id = tick.mirror.demand.demand_id
        assert demand_id in {contribution.demand_id for contribution in tick.pressure.added}
        assert demand_id in {
            source_demand
            for contribution in tick.force.contributions
            for source_demand in contribution.source_demands
        }
        assert all(
            proposal.proposal_id in event.supporting_proposals
            for event in tick.topology.events
            for proposal in tick.structure.proposals
            if proposal.proposal_id in event.supporting_proposals
        )

    assert {contribution.target_id for contribution in first[0].force.contributions} == {"A4"}
    assert "B1" in {contribution.target_id for contribution in first[2].force.contributions}


def test_scenario_001a_internal_source_only_establishes_a6_baseline() -> None:
    scenario = fib_flower_scenario_001()
    trace = run_scenario_001(scenario, foreign_source_available=False)

    assert len(trace) == 6
    assert all(tick.mirror.demand is not None for tick in trace)
    assert all(tick.pressure.added for tick in trace)
    assert all(
        {contribution.target_id for contribution in tick.force.contributions}
        == {scenario.internal_source_id}
        for tick in trace
    )
    assert all(tick.physics.distance > 0. for tick in trace)
    assert all(tick.structure.relationship_updates for tick in trace)

    for tick in trace:
        demand_id = tick.mirror.demand.demand_id
        assert demand_id in {contribution.demand_id for contribution in tick.pressure.added}
        assert demand_id in {
            source_demand
            for contribution in tick.force.contributions
            for source_demand in contribution.source_demands
        }


def test_scenario_001b_foreign_source_comparison_preserves_raw_traces() -> None:
    comparison = compare_scenario_001(fib_flower_scenario_001())

    assert comparison.internal_trace[:2] == comparison.foreign_trace[:2]
    assert all(
        {contribution.target_id for contribution in tick.force.contributions} == {"A4"}
        for tick in comparison.internal_trace
    )
    assert "B1" in {
        contribution.target_id
        for contribution in comparison.foreign_trace[2].force.contributions
    }
    assert set(comparison.final_deltas) == {
        "pressure",
        "gross_force",
        "resultant_force",
        "directional_bias",
        "tension",
        "displacement",
        "speed",
        "a4_a6_strain",
        "a4_a6_strengthening",
    }


def test_scenario_001_longitudinal_transition_regimes_preserve_causality() -> None:
    traces = {
        "internal": run_scenario_001(fib_flower_scenario_001(), foreign_source_available=True, foreign_compatibility=0., foreign_source_start_tick=1),
        "contested": run_scenario_001(fib_flower_scenario_001(), foreign_source_available=True, foreign_compatibility=.5, foreign_source_start_tick=1),
        "foreign": run_scenario_001(fib_flower_scenario_001(), foreign_source_available=True, foreign_compatibility=.75, foreign_source_start_tick=1),
    }

    for trace in traces.values():
        assert all(tick.pressure.resulting_total >= 0. for tick in trace)
        assert all(tick.force.gross_force >= tick.force.resultant_magnitude for tick in trace)
        assert all(
            tick.mirror.demand.demand_id in {
                demand_id
                for contribution in tick.force.contributions
                for demand_id in contribution.source_demands
            }
            for tick in trace
            if tick.mirror.demand is not None
        )
        assert all(
            tick.topology.committed
            or (
                tick.topology.resulting_state == tick.topology.prior_state
                and not tick.topology.events
            )
            for tick in trace
        )
