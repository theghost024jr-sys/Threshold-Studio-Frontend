import pytest

from engine.force import ForceResult
from engine.node_physics import (
    AccelerationPolicy,
    ConstraintPolicy,
    DampingPolicy,
    MotionClass,
    NodeMotionState,
    NodePhysicsContext,
    TimePolicy,
    VelocityPolicy,
    integrate_node,
)


def _force(vector: tuple[float, float], sequence: int = 1) -> ForceResult:
    magnitude = (vector[0] ** 2 + vector[1] ** 2) ** 0.5
    return ForceResult(
        node_id="node-a",
        pressure_sequence=sequence,
        world_tick=1,
        contributions=(),
        undirected_load=(),
        gross_force=magnitude,
        resultant_vector=vector,
        resultant_magnitude=magnitude,
        directional_bias=1.0 if magnitude else 0.0,
        tension=0.0,
        resistance_vector=(0.0, 0.0),
        effective_vector=vector,
        effective_magnitude=magnitude,
    )


def _state(**changes: object) -> NodeMotionState:
    values = {
        "node_id": "node-a",
        "sequence": 0,
        "position": (0.0, 0.0),
        "velocity": (0.0, 0.0),
        "acceleration": (0.0, 0.0),
        "mass": 1.0,
        "mobility": 1.0,
        "damping": 1.0,
        "last_integrated_tick": 0,
    }
    values.update(changes)
    return NodeMotionState(**values)


def _context(constraints: ConstraintPolicy | None = None) -> NodePhysicsContext:
    return NodePhysicsContext(
        world_tick=1,
        delta_ticks=1,
        time_policy=TimePolicy(units_per_tick=1.0),
        acceleration_policy=AccelerationPolicy(maximum_magnitude=10.0),
        damping_policy=DampingPolicy(),
        velocity_policy=VelocityPolicy(maximum_magnitude=10.0),
        constraint_policy=constraints or ConstraintPolicy(),
        rest_epsilon=0.01,
        rest_speed=0.01,
        drift_threshold=0.5,
    )


def test_force_integrates_velocity_before_position_and_observes_drift() -> None:
    result = integrate_node(_state(), _force((1.0, 0.0)), _context())

    assert result.acceleration == (1.0, 0.0)
    assert result.velocity == (1.0, 0.0)
    assert result.position == (1.0, 0.0)
    assert result.motion_class is MotionClass.DRIFTING


def test_momentum_can_move_a_node_without_current_force() -> None:
    result = integrate_node(
        _state(velocity=(1.0, 0.0), damping=0.5),
        _force((0.0, 0.0)),
        _context(),
    )

    assert result.acceleration == (0.0, 0.0)
    assert result.velocity == (0.5, 0.0)
    assert result.distance == pytest.approx(0.5)
    assert result.motion_class is MotionClass.MICRO_MOTION


def test_constraint_preserves_force_history_and_reports_frustration() -> None:
    result = integrate_node(
        _state(),
        _force((1.0, 0.0)),
        _context(ConstraintPolicy(maximum_position=(0.25, 1.0))),
    )

    assert result.proposed_displacement == (1.0, 0.0)
    assert result.actual_displacement == (0.25, 0.0)
    assert result.constraint_hits[0].axis == "x"
    assert result.motion_frustration == pytest.approx(0.75)
    assert result.force_sequence == 1


def test_resting_node_can_remain_stationary_under_zero_force() -> None:
    result = integrate_node(_state(), _force((0.0, 0.0)), _context())

    assert result.motion_class is MotionClass.RESTING
    assert result.distance == 0.0


def test_stale_force_is_rejected() -> None:
    with pytest.raises(ValueError, match="stale"):
        integrate_node(_state(sequence=2), _force((1.0, 0.0), sequence=1), _context())
