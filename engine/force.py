"""Field-supported conversion of node pressure into non-authoritative force."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import hypot, isfinite

from engine.pressure import PressureComponent, PressurePolarity, PressureResult

Vector = tuple[float, float]


class UndirectedLoadReason(str, Enum):
    NO_FIELD_TARGET = "no_field_target"
    NO_VALID_RELATIONSHIP = "no_valid_relationship"
    NO_VALID_REORGANIZATION_DIRECTION = "no_valid_reorganization_direction"


def _finite_non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
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


def _normalize(vector: Vector) -> Vector | None:
    magnitude = _magnitude(vector)
    if magnitude == 0.0:
        return None
    return _scale(vector, 1.0 / magnitude)


@dataclass(frozen=True, slots=True)
class NodeFieldState:
    node_id: str
    position: Vector

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        _vector("position", self.position)


@dataclass(frozen=True, slots=True)
class FieldCandidate:
    entity_id: str
    dimension_id: str
    position: Vector
    compatibility: float
    field_strength: float
    availability: float
    valid: bool = True
    direction_available: bool = True
    reorganization_direction: Vector | None = None

    def __post_init__(self) -> None:
        _identifier("entity_id", self.entity_id)
        _identifier("dimension_id", self.dimension_id)
        _vector("position", self.position)
        for name in ("compatibility", "field_strength", "availability"):
            _unit_interval(name, getattr(self, name))
        if self.reorganization_direction is not None:
            _vector("reorganization_direction", self.reorganization_direction)


@dataclass(frozen=True, slots=True)
class FieldState:
    world_tick: int
    candidates: tuple[FieldCandidate, ...]

    def __post_init__(self) -> None:
        if self.world_tick < 0:
            raise ValueError("world_tick must be non-negative")

    def find_candidates(self, dimension_id: str) -> tuple[FieldCandidate, ...]:
        return tuple(
            candidate
            for candidate in self.candidates
            if candidate.dimension_id == dimension_id
        )


@dataclass(frozen=True, slots=True)
class ForceState:
    node_id: str
    pressure_sequence: int
    world_tick: int

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.pressure_sequence < 0 or self.world_tick < 0:
            raise ValueError("force state sequence and world_tick must be non-negative")


@dataclass(frozen=True, slots=True)
class DistancePolicy:
    decay_per_unit: float

    def __post_init__(self) -> None:
        _finite_non_negative("decay_per_unit", self.decay_per_unit)

    def evaluate(self, distance: float) -> float:
        _finite_non_negative("distance", distance)
        return 1.0 / (1.0 + self.decay_per_unit * distance)


@dataclass(frozen=True, slots=True)
class ForcePolicy:
    maximum_magnitude: float

    def __post_init__(self) -> None:
        _finite_non_negative("maximum_magnitude", self.maximum_magnitude)

    def bound(self, raw_force: float) -> float:
        _finite_non_negative("raw_force", raw_force)
        return min(raw_force, self.maximum_magnitude)


@dataclass(frozen=True, slots=True)
class ReorganizationPolicy:
    """Reorganization uses only a declared field direction, never geometry by default."""

    def resolve_force(
        self,
        candidate: FieldCandidate,
        magnitude: float,
    ) -> Vector | None:
        _finite_non_negative("magnitude", magnitude)
        if candidate.reorganization_direction is None:
            return None
        direction = _normalize(candidate.reorganization_direction)
        return None if direction is None else _scale(direction, magnitude)


@dataclass(frozen=True, slots=True)
class ResistancePolicy:
    maximum_fraction: float

    def __post_init__(self) -> None:
        _unit_interval("maximum_fraction", self.maximum_fraction)

    def evaluate(
        self,
        node: NodeFieldState,
        field: FieldState,
        applied_force: Vector,
    ) -> Vector:
        _vector("applied_force", applied_force)
        direction = _normalize(applied_force)
        if direction is None:
            return (0.0, 0.0)
        return _scale(direction, -_magnitude(applied_force) * self.maximum_fraction)


@dataclass(frozen=True, slots=True)
class ForceContext:
    world_tick: int
    distance_policy: DistancePolicy
    force_policy: ForcePolicy
    reorganization_policy: ReorganizationPolicy
    resistance_policy: ResistancePolicy

    def __post_init__(self) -> None:
        if self.world_tick < 0:
            raise ValueError("world_tick must be non-negative")


@dataclass(frozen=True, slots=True)
class ForceContribution:
    dimension_id: str
    target_id: str
    pressure_polarity: PressurePolarity
    pressure_magnitude: float
    magnitude: float
    vector: Vector
    source_demands: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _identifier("target_id", self.target_id)
        _unit_interval("pressure_magnitude", self.pressure_magnitude)
        _finite_non_negative("magnitude", self.magnitude)
        _vector("vector", self.vector)
        if not self.source_demands:
            raise ValueError("source_demands must not be empty")


@dataclass(frozen=True, slots=True)
class UndirectedLoad:
    dimension_id: str
    polarity: PressurePolarity
    magnitude: float
    reason: UndirectedLoadReason

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _unit_interval("magnitude", self.magnitude)


@dataclass(frozen=True, slots=True)
class ForceResult:
    node_id: str
    pressure_sequence: int
    world_tick: int
    contributions: tuple[ForceContribution, ...]
    undirected_load: tuple[UndirectedLoad, ...]
    gross_force: float
    resultant_vector: Vector
    resultant_magnitude: float
    directional_bias: float
    tension: float
    resistance_vector: Vector
    effective_vector: Vector
    effective_magnitude: float

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.pressure_sequence < 0 or self.world_tick < 0:
            raise ValueError("pressure_sequence and world_tick must be non-negative")
        for name in ("gross_force", "resultant_magnitude", "tension", "effective_magnitude"):
            _finite_non_negative(name, getattr(self, name))
        _unit_interval("directional_bias", self.directional_bias)
        for name in ("resultant_vector", "resistance_vector", "effective_vector"):
            _vector(name, getattr(self, name))
        if self.effective_magnitude > self.resultant_magnitude:
            raise ValueError("resistance cannot create propulsion")


def evaluate_force(
    pressure: PressureResult,
    field: FieldState,
    node: NodeFieldState,
    prior_force: ForceState,
    context: ForceContext,
) -> ForceResult:
    """Convert pressure to field-supported force without updating node motion."""

    if pressure.node_id != node.node_id or prior_force.node_id != node.node_id:
        raise ValueError("pressure and prior force must belong to node.node_id")
    if field.world_tick != context.world_tick:
        raise ValueError("FieldState world_tick must equal ForceContext world_tick")
    if pressure.sequence < prior_force.pressure_sequence:
        raise ValueError("PressureResult sequence is stale")
    if pressure.resulting_total == 0.0:
        return ForceResult(
            node_id=node.node_id,
            pressure_sequence=pressure.sequence,
            world_tick=context.world_tick,
            contributions=(),
            undirected_load=(),
            gross_force=0.0,
            resultant_vector=(0.0, 0.0),
            resultant_magnitude=0.0,
            directional_bias=0.0,
            tension=0.0,
            resistance_vector=(0.0, 0.0),
            effective_vector=(0.0, 0.0),
            effective_magnitude=0.0,
        )

    contributions: list[ForceContribution] = []
    undirected_load: list[UndirectedLoad] = []
    for component in pressure.components:
        _evaluate_component(
            component,
            field.find_candidates(component.dimension_id),
            node,
            context,
            contributions,
            undirected_load,
        )

    resultant_vector = (0.0, 0.0)
    gross_force = 0.0
    for contribution in contributions:
        resultant_vector = _add(resultant_vector, contribution.vector)
        gross_force += contribution.magnitude
    resultant_magnitude = _magnitude(resultant_vector)
    directional_bias = 0.0 if gross_force == 0.0 else resultant_magnitude / gross_force
    tension = gross_force * (1.0 - directional_bias)
    resistance_vector = context.resistance_policy.evaluate(node, field, resultant_vector)
    if _magnitude(resistance_vector) > resultant_magnitude:
        raise ValueError("resistance policy exceeded applied force")
    effective_vector = _add(resultant_vector, resistance_vector)
    effective_magnitude = _magnitude(effective_vector)
    return ForceResult(
        node_id=node.node_id,
        pressure_sequence=pressure.sequence,
        world_tick=context.world_tick,
        contributions=tuple(contributions),
        undirected_load=tuple(undirected_load),
        gross_force=gross_force,
        resultant_vector=resultant_vector,
        resultant_magnitude=resultant_magnitude,
        directional_bias=directional_bias,
        tension=tension,
        resistance_vector=resistance_vector,
        effective_vector=effective_vector,
        effective_magnitude=effective_magnitude,
    )


def _evaluate_component(
    component: PressureComponent,
    candidates: tuple[FieldCandidate, ...],
    node: NodeFieldState,
    context: ForceContext,
    contributions: list[ForceContribution],
    undirected_load: list[UndirectedLoad],
) -> None:
    if not candidates:
        undirected_load.append(
            UndirectedLoad(
                dimension_id=component.dimension_id,
                polarity=component.polarity,
                magnitude=component.magnitude,
                reason=UndirectedLoadReason.NO_FIELD_TARGET,
            )
        )
        return

    contribution_count = len(contributions)
    for candidate in candidates:
        if not candidate.valid or not candidate.direction_available:
            continue
        direction = _normalize(_subtract(candidate.position, node.position))
        if direction is None:
            continue
        magnitude = context.force_policy.bound(
            component.magnitude
            * candidate.compatibility
            * candidate.field_strength
            * candidate.availability
            * context.distance_policy.evaluate(
                _magnitude(_subtract(candidate.position, node.position))
            )
        )
        if magnitude == 0.0:
            continue
        vector = _force_vector(component.polarity, direction, candidate, magnitude, context)
        if vector is None:
            continue
        contributions.append(
            ForceContribution(
                dimension_id=component.dimension_id,
                target_id=candidate.entity_id,
                pressure_polarity=component.polarity,
                pressure_magnitude=component.magnitude,
                magnitude=magnitude,
                vector=vector,
                source_demands=component.source_demands,
            )
        )
    if len(contributions) == contribution_count:
        reason = (
            UndirectedLoadReason.NO_VALID_REORGANIZATION_DIRECTION
            if component.polarity is PressurePolarity.REORGANIZATIONAL
            else UndirectedLoadReason.NO_VALID_RELATIONSHIP
        )
        undirected_load.append(
            UndirectedLoad(
                dimension_id=component.dimension_id,
                polarity=component.polarity,
                magnitude=component.magnitude,
                reason=reason,
            )
        )


def _force_vector(
    polarity: PressurePolarity,
    direction: Vector,
    candidate: FieldCandidate,
    magnitude: float,
    context: ForceContext,
) -> Vector | None:
    if polarity is PressurePolarity.ATTRACTIVE:
        return _scale(direction, magnitude)
    if polarity is PressurePolarity.REPULSIVE:
        return _scale(direction, -magnitude)
    return context.reorganization_policy.resolve_force(candidate, magnitude)
