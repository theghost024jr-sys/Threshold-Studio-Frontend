from engine.circuit_mirror import *
from engine.force import *
from engine.node_physics import *
from engine.pressure import *
from engine.structural import *
from engine.topology import *


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


def _evidence(support: float = .9) -> EvidenceSummary:
    return EvidenceSummary(("evidence-1",), ("node-b",), ("signal",), support, support, support, support)


def _pressure_context(world_tick: int = 1) -> PressureContext:
    return PressureContext(world_tick, 1, PressureDecayPolicy(.9), PressureAccumulationPolicy(1., 1.), PressureCancellationPolicy())


def _topology() -> TopologyState:
    nodes = (
        TopologicalNode("node-a", "flower-a", 1, NodeLifecycle.ACTIVE, ("relationship-a-b",)),
        TopologicalNode("node-b", "flower-a", 1, NodeLifecycle.ACTIVE, ("relationship-a-b",)),
    )
    relationship = Relationship("relationship-a-b", "node-a", "node-b", RelationshipKind.ORDINARY, .5, 0, 0)
    return TopologyState(0, 0, nodes, (relationship,), (FlowerTopology("flower-a", (1,), ("node-a", "node-b")),))


def test_supported_evidence_propagates_through_return_loop() -> None:
    mirror = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., _evidence()),
        ReflectionContext("reflection-1", "node-a", 1, 1),
        _mirror_config(),
    )
    pressure = evaluate_pressure(
        prior=PressureState("node-a", 0, (), 0., None, None, 0, ()),
        mirror_output=mirror.output,
        context=_pressure_context(),
    )
    force = evaluate_force(
        pressure,
        FieldState(1, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", (0., 0.)),
        ForceState("node-a", 0, 0),
        ForceContext(1, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    physics = integrate_node(
        NodeMotionState("node-a", 0, (0., 0.), (0., 0.), (0., 0.), 1., 1., 1., 0),
        force,
        NodePhysicsContext(1, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), 0., 0., .001),
    )
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)
    structure = evaluate_structure(
        "node-a", pressure, force, physics, FlowerState("flower-a", (0., 0.), (1.,), 1.),
        StructuralState("node-a", 0, StructuralRegime.STABLE, "flower-a", 0, 1., ()),
        StructuralContext(1, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2)),
    )
    topology = evaluate_topology(_topology(), (structure,), TopologyContext(0, 1))

    assert mirror.output.classification is not ReflectionClass.INSUFFICIENT
    assert mirror.output.discrepancy is not None
    assert mirror.output.demand is not None
    assert mirror.output.unresolved
    assert mirror.output.confidence > 0.
    assert pressure.added
    assert pressure.resulting_total > pressure.prior_total
    assert mirror.output.demand.demand_id in {
        contribution.demand_id for contribution in pressure.added
    }
    assert force.contributions
    assert force.gross_force > 0.
    assert force.resultant_magnitude > 0.
    assert force.effective_magnitude > 0.
    assert force.directional_bias > 0.
    assert mirror.output.demand.demand_id in {
        demand_id
        for contribution in force.contributions
        for demand_id in contribution.source_demands
    }
    assert physics.distance > 0.
    assert physics.actual_displacement != (0., 0.)
    assert structure.observations
    assert structure.resulting_state is not None
    assert topology.resulting_state is not None


def test_persistent_mutual_resolution_can_establish_anchor() -> None:
    mirror = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., _evidence()),
        ReflectionContext("reflection-1", "node-a", 1, 1),
        _mirror_config(),
    )
    pressure = evaluate_pressure(
        prior=PressureState("node-a", 0, (), 0., None, None, 0, ()),
        mirror_output=mirror.output,
        context=_pressure_context(),
    )
    force = evaluate_force(
        pressure,
        FieldState(1, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", (0., 0.)),
        ForceState("node-a", 0, 0),
        ForceContext(1, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    physics = integrate_node(
        NodeMotionState("node-a", 0, (0., 0.), (0., 0.), (0., 0.), 1., 1., 1., 0),
        force,
        NodePhysicsContext(1, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), 0., 0., .001),
    )
    relation = RelationshipState("relationship-a-b", "node-b", (1., 0.), 1., 1., 1., 1., 0., 0., PersistenceStreak(1, 1, 1., 0, 0))
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)
    structure = evaluate_structure(
        "node-a", pressure, force, physics, FlowerState("flower-a", (0., 0.), (1.,), 1.),
        StructuralState("node-a", 0, StructuralRegime.STABLE, "flower-a", 0, 1., (relation,)),
        StructuralContext(1, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2)),
    )
    topology = evaluate_topology(_topology(), (structure,), TopologyContext(0, 1))

    assert any(p.proposal_type is ProposalType.STRENGTHEN_TO_ANCHOR for p in structure.proposals)
    assert topology.committed
    assert topology.resulting_state.relationships[0].kind is RelationshipKind.ANCHOR


def test_resolving_evidence_closes_the_return_loop_without_structural_failure() -> None:
    initial = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., _evidence()),
        ReflectionContext("reflection-1", "node-a", 1, 1),
        _mirror_config(),
    )
    pressured = evaluate_pressure(
        prior=PressureState("node-a", 0, (), 0., None, None, 0, ()),
        mirror_output=initial.output,
        context=_pressure_context(),
    )
    initial_force = evaluate_force(
        pressured,
        FieldState(1, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", (0., 0.)),
        ForceState("node-a", 0, 0),
        ForceContext(1, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    initial_physics = integrate_node(
        NodeMotionState("node-a", 0, (0., 0.), (0., 0.), (0., 0.), 1., 1., .1, 0),
        initial_force,
        NodePhysicsContext(1, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), 0., 0., .001),
    )

    resolution = reflect_circuit_mirror(
        initial.next_state,
        CircuitMirrorSignal(1., .6, .7, .2, 1., _evidence()),
        ReflectionContext("reflection-2", "node-a", 2, 2),
        _mirror_config(),
    )
    relieved = evaluate_pressure(
        prior=pressured.resulting_state,
        mirror_output=resolution.output,
        context=_pressure_context(2),
    )
    decay_only = evaluate_pressure(
        prior=pressured.resulting_state,
        mirror_output=resolution.output,
        context=PressureContext(2, 1, PressureDecayPolicy(.9), PressureAccumulationPolicy(1., 0.), PressureCancellationPolicy()),
    )
    resolved_force = evaluate_force(
        relieved,
        FieldState(2, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", initial_physics.position),
        ForceState("node-a", initial_force.pressure_sequence, 1),
        ForceContext(2, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    resolved_physics = integrate_node(
        initial_physics.resulting_state,
        resolved_force,
        NodePhysicsContext(2, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), 0., 0., .001),
    )
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)
    relation = RelationshipState("relationship-a-b", "node-b", (1., 0.), 1., 1., 1., 1., 0., 0.)
    structure = evaluate_structure(
        "node-a",
        relieved,
        resolved_force,
        resolved_physics,
        FlowerState("flower-a", (0., 0.), (1.,), 1.),
        StructuralState("node-a", 1, StructuralRegime.STABLE, "flower-a", 0, 1., (relation,), last_evaluated_tick=1),
        StructuralContext(2, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2)),
    )

    assert resolution.output.transition is MirrorTransition.RESOLUTION_ACHIEVED
    assert resolution.output.demand is None
    assert not resolution.output.unresolved
    assert relieved.relieved
    assert initial.output.demand is not None
    assert initial.output.demand.demand_id in {
        demand_id
        for relief in relieved.relieved
        for demand_id in relief.resolved_demand_ids
    }
    assert relieved.resulting_total < pressured.resulting_total
    assert relieved.resulting_total < decay_only.resulting_total
    assert resolved_force.effective_magnitude < initial_force.effective_magnitude
    assert resolved_physics.velocity[0] < initial_physics.velocity[0]
    assert not {
        ProposalType.WEAKEN_RELATIONSHIP,
        ProposalType.FRACTURE_PROPAGATION,
        ProposalType.COLLAPSE_CANDIDATE,
    }.intersection(proposal.proposal_type for proposal in structure.proposals)


def test_closed_circuit_settles_across_multiple_ticks_without_structural_failure() -> None:
    initial = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.SEEKING, .6, .8, .7, .2, .4),
        CircuitMirrorSignal(.8, .6, .7, .3, 0., _evidence()),
        ReflectionContext("reflection-1", "node-a", 1, 1),
        _mirror_config(),
    )
    pressured = evaluate_pressure(
        prior=PressureState("node-a", 0, (), 0., None, None, 0, ()),
        mirror_output=initial.output,
        context=_pressure_context(),
    )
    force = evaluate_force(
        pressured,
        FieldState(1, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", (0., 0.)),
        ForceState("node-a", 0, 0),
        ForceContext(1, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    motion = integrate_node(
        NodeMotionState("node-a", 0, (0., 0.), (0., 0.), (0., 0.), 1., 1., .1, 0),
        force,
        NodePhysicsContext(1, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), .001, .001, .01),
    )
    resolution = reflect_circuit_mirror(
        initial.next_state,
        CircuitMirrorSignal(1., .6, .7, .2, 1., _evidence()),
        ReflectionContext("reflection-2", "node-a", 2, 2),
        _mirror_config(),
    )
    pressure = evaluate_pressure(
        prior=pressured.resulting_state,
        mirror_output=resolution.output,
        context=_pressure_context(2),
    )
    force = evaluate_force(
        pressure,
        FieldState(2, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
        NodeFieldState("node-a", motion.position),
        ForceState("node-a", force.pressure_sequence, 1),
        ForceContext(2, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    motion = integrate_node(
        motion.resulting_state,
        force,
        NodePhysicsContext(2, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), .001, .001, .01),
    )
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)
    history = StructuralState("node-a", 1, StructuralRegime.STABLE, "flower-a", 0, 1., (), last_evaluated_tick=1)
    mirror_state = resolution.next_state
    previous_speed = (motion.velocity[0] ** 2 + motion.velocity[1] ** 2) ** .5

    for tick in range(3, 61):
        settling = reflect_circuit_mirror(
            mirror_state,
            CircuitMirrorSignal(.8, .6, .7, .2, 0., _evidence(.1)),
            ReflectionContext(f"reflection-{tick}", "node-a", tick, tick),
            _mirror_config(),
        )
        assert settling.output.demand is None

        pressure = evaluate_pressure(
            prior=pressure.resulting_state,
            mirror_output=settling.output,
            context=_pressure_context(tick),
        )
        force = evaluate_force(
            pressure,
            FieldState(tick, (FieldCandidate("node-b", "signal", (1., 0.), 1., 1., 1.),)),
            NodeFieldState("node-a", motion.position),
            ForceState("node-a", force.pressure_sequence, tick - 1),
            ForceContext(tick, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
        )
        motion = integrate_node(
            motion.resulting_state,
            force,
            NodePhysicsContext(tick, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), .001, .001, .01),
        )
        current_speed = (motion.velocity[0] ** 2 + motion.velocity[1] ** 2) ** .5
        structure = evaluate_structure(
            "node-a",
            pressure,
            force,
            motion,
            FlowerState("flower-a", (0., 0.), (1.,), 1.),
            history,
            StructuralContext(tick, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2)),
        )

        assert not {
            ProposalType.WEAKEN_RELATIONSHIP,
            ProposalType.FRACTURE_PROPAGATION,
            ProposalType.COLLAPSE_CANDIDATE,
        }.intersection(proposal.proposal_type for proposal in structure.proposals)
        assert current_speed <= previous_speed
        mirror_state = settling.next_state
        history = structure.resulting_state
        previous_speed = current_speed

    assert motion.motion_class is MotionClass.RESTING
    assert motion.distance <= .001


def test_insufficient_evidence_cannot_create_world_effects() -> None:
    """Insufficient evidence terminates the causal branch without world effects."""
    topology_before = _topology()
    pressure_before = PressureState("node-a", 0, (), 0., None, None, 0, ())
    mirror = reflect_circuit_mirror(
        CircuitMirrorState(MirrorState.DORMANT, .6, 0., .7, .2, 0.),
        CircuitMirrorSignal(.8, .6, .7, .2, 0., _evidence(.1)),
        ReflectionContext("reflection-1", "node-a", 1, 1),
        _mirror_config(),
    )
    pressure = evaluate_pressure(
        prior=pressure_before,
        mirror_output=mirror.output,
        context=_pressure_context(),
    )
    force = evaluate_force(
        pressure,
        FieldState(1, ()),
        NodeFieldState("node-a", (0., 0.)),
        ForceState("node-a", 0, 0),
        ForceContext(1, DistancePolicy(0.), ForcePolicy(1.), ReorganizationPolicy(), ResistancePolicy(0.)),
    )
    physics = integrate_node(
        NodeMotionState("node-a", 0, (0., 0.), (0., 0.), (0., 0.), 1., 1., 1., 0),
        force,
        NodePhysicsContext(1, 1, TimePolicy(1.), AccelerationPolicy(1.), DampingPolicy(), VelocityPolicy(1.), ConstraintPolicy(), 0., 0., .001),
    )
    thresholds = StructuralThresholds(.01, .01, .01, .9, .9, .001, .5, .5, .01, 1., 1., 1., 0., .01, 1., 1., 1., 1., 1., 1)
    structure = evaluate_structure(
        "node-a",
        pressure,
        force,
        physics,
        FlowerState("flower-a", (0., 0.), (1.,), 1.),
        StructuralState("node-a", 0, StructuralRegime.STABLE, "flower-a", 0, 1., ()),
        StructuralContext(1, thresholds, StructuralWindows(2, 2, 2, 2, 2, 2)),
    )
    topology = evaluate_topology(topology_before, (structure,), TopologyContext(0, 1))

    assert mirror.output.classification is ReflectionClass.INSUFFICIENT
    assert mirror.output.demand is None
    assert pressure.added == ()
    assert pressure.relieved == ()
    assert pressure.resulting_total == 0.
    assert pressure.resulting_total == pressure_before.total
    assert force.gross_force == 0.
    assert force.resultant_magnitude == 0.
    assert force.contributions == ()
    assert physics.distance == 0.
    assert physics.velocity == (0., 0.)
    assert structure.proposals == ()
    assert not topology.committed
    assert topology.events == ()
    assert topology.resulting_state == topology_before
