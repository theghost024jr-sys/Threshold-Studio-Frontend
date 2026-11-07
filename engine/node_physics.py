"""Deterministic node motion integration from non-authoritative Force results."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import hypot, isfinite

from engine.force import ForceResult, Vector


class MotionClass(str, Enum):
    RESTING = "resting"
    MICRO_MOTION = "micro_motion"
    DRIFTING = "drifting"


def _finite_non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _positive(name: str, value: float) -> float:
    if not isfinite(value) or value <= 0.0:
        raise ValueError(f"{name} must be finite and greater than 0")
    return value


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _identifier(name: str, value: str) -> str:
    if not value.strip():
        raise ValueError(f"{name} must not be empty")
    return value


def _vector(name: str, value: Vector) -> Vector:
    if len(value) != 2 or not all(isfinite(component) for component in value):
        raise ValueError(f"{name} must be a two-dimensional finite vector")
    return value


def _add(first: Vector, second: Vector) -> Vector:
    return (first[0] + second[0], first[1] + second[1])


def _subtract(first: Vector, second: Vector) -> Vector:
    return (first[0] - second[0], first[1] - second[1])


def _scale(vector: Vector, amount: float) -> Vector:
    return (vector[0] * amount, vector[1] * amount)


def _magnitude(vector: Vector) -> float:
    return hypot(vector[0], vector[1])


def _bound_vector(vector: Vector, maximum: float) -> Vector:
    magnitude = _magnitude(vector)
    if magnitude <= maximum or magnitude == 0.0:
        return vector
    return _scale(vector, maximum / magnitude)


@dataclass(frozen=True, slots=True)
class NodeMotionState:
    node_id: str
    sequence: int
    position: Vector
    velocity: Vector
    acceleration: Vector
    mass: float
    mobility: float
    damping: float
    last_integrated_tick: int

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.sequence < 0 or self.last_integrated_tick < 0:
            raise ValueError("sequence and last_integrated_tick must be non-negative")
        for name in ("position", "velocity", "acceleration"):
            _vector(name, getattr(self, name))
        _positive("mass", self.mass)
        _unit_interval("mobility", self.mobility)
        _unit_interval("damping", self.damping)


@dataclass(frozen=True, slots=True)
class TimePolicy:
    units_per_tick: float

    def __post_init__(self) -> None:
        _positive("units_per_tick", self.units_per_tick)

    def to_delta(self, delta_ticks: int) -> float:
        if delta_ticks < 1:
            raise ValueError("delta_ticks must be positive")
        return self.units_per_tick * delta_ticks


@dataclass(frozen=True, slots=True)
class AccelerationPolicy:
    maximum_magnitude: float

    def __post_init__(self) -> None:
        _finite_non_negative("maximum_magnitude", self.maximum_magnitude)

    def bound(self, acceleration: Vector) -> Vector:
        _vector("acceleration", acceleration)
        return _bound_vector(acceleration, self.maximum_magnitude)


@dataclass(frozen=True, slots=True)
class VelocityPolicy:
    maximum_magnitude: float

    def __post_init__(self) -> None:
        _finite_non_negative("maximum_magnitude", self.maximum_magnitude)

    def bound(self, velocity: Vector) -> Vector:
        _vector("velocity", velocity)
        return _bound_vector(velocity, self.maximum_magnitude)


@dataclass(frozen=True, slots=True)
class DampingPolicy:
    """The state damping value is a per-time-unit velocity retention factor."""

    def apply(self, velocity: Vector, damping: float, dt: float) -> Vector:
        _vector("velocity", velocity)
        _unit_interval("damping", damping)
        _positive("dt", dt)
        return _scale(velocity, damping**dt)


@dataclass(frozen=True, slots=True)
class ConstraintHit:
    axis: str
    boundary: str

    def __post_init__(self) -> None:
        if self.axis not in ("x", "y"):
            raise ValueError("axis must be x or y")
        if self.boundary not in ("minimum", "maximum"):
            raise ValueError("boundary must be minimum or maximum")


@dataclass(frozen=True, slots=True)
class ConstraintResult:
    position: Vector
    velocity: Vector
    hits: tuple[ConstraintHit, ...]

    def __post_init__(self) -> None:
        _vector("position", self.position)
        _vector("velocity", self.velocity)


@dataclass(frozen=True, slots=True)
class ConstraintPolicy:
    minimum_position: Vector | None = None
    maximum_position: Vector | None = None

    def __post_init__(self) -> None:
        if self.minimum_position is not None:
            _vector("minimum_position", self.minimum_position)
        if self.maximum_position is not None:
            _vector("maximum_position", self.maximum_position)
        if (
            self.minimum_position is not None
            and self.maximum_position is not None
            and any(
                minimum > maximum
                for minimum, maximum in zip(
                    self.minimum_position, self.maximum_position, strict=True
                )
            )
        ):
            raise ValueError("minimum_position must not exceed maximum_position")

    def resolve(
        self,
        node_id: str,
        prior_position: Vector,
        proposed_position: Vector,
        velocity: Vector,
    ) -> ConstraintResult:
        _identifier("node_id", node_id)
        _vector("prior_position", prior_position)
        _vector("proposed_position", proposed_position)
        _vector("velocity", velocity)
        position = list(proposed_position)
        resulting_velocity = list(velocity)
        hits: list[ConstraintHit] = []
        for index, axis in enumerate(("x", "y")):
            if (
                self.minimum_position is not None
                and position[index] < self.minimum_position[index]
            ):
                position[index] = self.minimum_position[index]
                resulting_velocity[index] = 0.0
                hits.append(ConstraintHit(axis=axis, boundary="minimum"))
            if (
                self.maximum_position is not None
                and position[index] > self.maximum_position[index]
            ):
                position[index] = self.maximum_position[index]
                resulting_velocity[index] = 0.0
                hits.append(ConstraintHit(axis=axis, boundary="maximum"))
        return ConstraintResult(
            position=(position[0], position[1]),
            velocity=(resulting_velocity[0], resulting_velocity[1]),
            hits=tuple(hits),
        )


@dataclass(frozen=True, slots=True)
class NodePhysicsContext:
    world_tick: int
    delta_ticks: int
    time_policy: TimePolicy
    acceleration_policy: AccelerationPolicy
    damping_policy: DampingPolicy
    velocity_policy: VelocityPolicy
    constraint_policy: ConstraintPolicy
    rest_epsilon: float
    rest_speed: float
    drift_threshold: float

    def __post_init__(self) -> None:
        if self.world_tick < 0 or self.delta_ticks < 1:
            raise ValueError("world_tick must be non-negative and delta_ticks positive")
        for name in ("rest_epsilon", "rest_speed", "drift_threshold"):
            _finite_non_negative(name, getattr(self, name))


@dataclass(frozen=True, slots=True)
class NodePhysicsResult:
    node_id: str
    sequence: int
    world_tick: int
    prior_position: Vector
    position: Vector
    prior_velocity: Vector
    velocity: Vector
    acceleration: Vector
    proposed_displacement: Vector
    actual_displacement: Vector
    distance: float
    motion_class: MotionClass
    motion_frustration: float
    constraint_hits: tuple[ConstraintHit, ...]
    force_sequence: int
    resulting_state: NodeMotionState

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.sequence < 1 or self.world_tick < 0 or self.force_sequence < 0:
            raise ValueError("sequence must be positive and ticks non-negative")
        for name in (
            "prior_position",
            "position",
            "prior_velocity",
            "velocity",
            "acceleration",
            "proposed_displacement",
            "actual_displacement",
        ):
            _vector(name, getattr(self, name))
        _finite_non_negative("distance", self.distance)
        _unit_interval("motion_frustration", self.motion_frustration)
        if self.resulting_state.node_id != self.node_id:
            raise ValueError("resulting_state must belong to node_id")


def integrate_node(
    prior: NodeMotionState,
    force: ForceResult,
    context: NodePhysicsContext,
) -> NodePhysicsResult:
    """Use semi-implicit Euler integration without mutating force or topology."""

    if force.node_id != prior.node_id:
        raise ValueError("ForceResult node_id must match NodeMotionState node_id")
    if force.world_tick != context.world_tick:
        raise ValueError("ForceResult world_tick must equal NodePhysicsContext world_tick")
    if force.pressure_sequence < prior.sequence:
        raise ValueError("ForceResult is stale for this NodeMotionState")
    if context.world_tick <= prior.last_integrated_tick:
        raise ValueError("world_tick must advance beyond last_integrated_tick")

    dt = context.time_policy.to_delta(context.delta_ticks)
    acceleration = context.acceleration_policy.bound(
        _scale(force.effective_vector, prior.mobility / prior.mass)
    )
    velocity = context.velocity_policy.bound(
        context.damping_policy.apply(
            _add(prior.velocity, _scale(acceleration, dt)),
            prior.damping,
            dt,
        )
    )
    proposed_position = _add(prior.position, _scale(velocity, dt))
    constraint_result = context.constraint_policy.resolve(
        prior.node_id,
        prior.position,
        proposed_position,
        velocity,
    )
    proposed_displacement = _subtract(proposed_position, prior.position)
    actual_displacement = _subtract(constraint_result.position, prior.position)
    distance = _magnitude(actual_displacement)
    motion_class = _classify_motion(
        constraint_result.velocity,
        distance,
        context,
    )
    frustration = _frustration(acceleration, dt, actual_displacement)
    resulting_state = NodeMotionState(
        node_id=prior.node_id,
        sequence=prior.sequence + 1,
        position=constraint_result.position,
        velocity=constraint_result.velocity,
        acceleration=acceleration,
        mass=prior.mass,
        mobility=prior.mobility,
        damping=prior.damping,
        last_integrated_tick=context.world_tick,
    )
    return NodePhysicsResult(
        node_id=prior.node_id,
        sequence=resulting_state.sequence,
        world_tick=context.world_tick,
        prior_position=prior.position,
        position=constraint_result.position,
        prior_velocity=prior.velocity,
        velocity=constraint_result.velocity,
        acceleration=acceleration,
        proposed_displacement=proposed_displacement,
        actual_displacement=actual_displacement,
        distance=distance,
        motion_class=motion_class,
        motion_frustration=frustration,
        constraint_hits=constraint_result.hits,
        force_sequence=force.pressure_sequence,
        resulting_state=resulting_state,
    )


def _classify_motion(
    velocity: Vector,
    distance: float,
    context: NodePhysicsContext,
) -> MotionClass:
    if distance <= context.rest_epsilon and _magnitude(velocity) <= context.rest_speed:
        return MotionClass.RESTING
    if distance > context.drift_threshold:
        return MotionClass.DRIFTING
    return MotionClass.MICRO_MOTION


def _frustration(acceleration: Vector, dt: float, displacement: Vector) -> float:
    expected = _magnitude(acceleration) * dt * dt
    if expected == 0.0:
        return 0.0
    return min(1.0, max(0.0, 1.0 - _magnitude(displacement) / expected))
