"""Pure accumulation of evidence-backed Mirror demand into bounded pressure."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import exp, isfinite

from engine.circuit_mirror import (
    DemandPolarity,
    MirrorOutput,
    MirrorTransition,
)


class PressurePolarity(str, Enum):
    ATTRACTIVE = "attractive"
    REPULSIVE = "repulsive"
    REORGANIZATIONAL = "reorganizational"


class PressureTrend(str, Enum):
    RISING = "rising"
    FALLING = "falling"
    STABLE = "stable"
    NONE = "none"


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


def _identifier(name: str, value: str) -> str:
    if not value.strip():
        raise ValueError(f"{name} must not be empty")
    return value


def _identifiers(name: str, values: tuple[str, ...]) -> tuple[str, ...]:
    for value in values:
        _identifier(name, value)
    if len(set(values)) != len(values):
        raise ValueError(f"{name} values must be unique")
    return values


def _saturate(raw_load: float) -> float:
    return 1.0 - exp(-raw_load)


@dataclass(frozen=True, slots=True)
class PressureComponent:
    """One dimensional unresolved load with unbounded internal accumulation."""

    dimension_id: str
    raw_load: float
    magnitude: float
    polarity: PressurePolarity
    persistence: float
    confidence: float
    source_demands: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _non_negative("raw_load", self.raw_load)
        _unit_interval("magnitude", self.magnitude)
        _unit_interval("persistence", self.persistence)
        _unit_interval("confidence", self.confidence)
        _identifiers("source_demand", self.source_demands)
        if self.magnitude != _saturate(self.raw_load):
            raise ValueError("magnitude must be the saturation of raw_load")


@dataclass(frozen=True, slots=True)
class PressureState:
    node_id: str
    sequence: int
    components: tuple[PressureComponent, ...]
    total: float
    dominant_dimension: str | None
    accumulated_since: int | None
    last_evaluated_at: int
    source_demands: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.sequence < 0:
            raise ValueError("sequence must be non-negative")
        _unit_interval("total", self.total)
        if self.dominant_dimension is not None:
            _identifier("dominant_dimension", self.dominant_dimension)
        if self.accumulated_since is not None and self.accumulated_since < 0:
            raise ValueError("accumulated_since must be non-negative")
        if self.last_evaluated_at < 0:
            raise ValueError("last_evaluated_at must be non-negative")
        _identifiers("source_demand", self.source_demands)
        component_keys = {
            (component.dimension_id, component.polarity) for component in self.components
        }
        if len(component_keys) != len(self.components):
            raise ValueError("components must have unique dimension and polarity pairs")
        if not self.components and (
            self.total != 0.0
            or self.dominant_dimension is not None
            or self.accumulated_since is not None
            or self.source_demands
        ):
            raise ValueError("empty pressure state cannot retain pressure metadata")


@dataclass(frozen=True, slots=True)
class PressureDecayPolicy:
    """Per-tick raw-load retention; zero removes load and one preserves it."""

    retention_per_tick: float

    def __post_init__(self) -> None:
        _unit_interval("retention_per_tick", self.retention_per_tick)

    def decay(
        self,
        raw_load: float,
        elapsed_ticks: int,
        persistence: float,
        confidence: float,
    ) -> float:
        _non_negative("raw_load", raw_load)
        if elapsed_ticks < 0:
            raise ValueError("elapsed_ticks must be non-negative")
        _unit_interval("persistence", persistence)
        _unit_interval("confidence", confidence)
        retention = self.retention_per_tick + (
            1.0 - self.retention_per_tick
        ) * persistence * confidence
        return raw_load * retention**elapsed_ticks


@dataclass(frozen=True, slots=True)
class PressureAccumulationPolicy:
    contribution_gain: float
    resolution_relief_gain: float

    def __post_init__(self) -> None:
        _unit_interval("contribution_gain", self.contribution_gain)
        _unit_interval("resolution_relief_gain", self.resolution_relief_gain)

    def contribution(
        self,
        intensity: float,
        specificity: float,
        persistence: float,
        confidence: float,
        weight: float,
    ) -> float:
        for name, value in (
            ("intensity", intensity),
            ("specificity", specificity),
            ("persistence", persistence),
            ("confidence", confidence),
            ("weight", weight),
        ):
            _unit_interval(name, value)
        return (
            intensity
            * specificity
            * persistence
            * confidence
            * weight
            * self.contribution_gain
        )

    def update_persistence(
        self,
        prior: float,
        incoming: float,
        world_tick: int,
    ) -> float:
        _unit_interval("prior", prior)
        _unit_interval("incoming", incoming)
        if world_tick < 0:
            raise ValueError("world_tick must be non-negative")
        return prior + (1.0 - prior) * incoming

    def update_confidence(self, prior: float, mirror_confidence: float) -> float:
        _unit_interval("prior", prior)
        _unit_interval("mirror_confidence", mirror_confidence)
        return prior + (1.0 - prior) * mirror_confidence


@dataclass(frozen=True, slots=True)
class PressureCancellationPolicy:
    """Only configured opposite attractive/repulsive loads may cancel."""

    cancellable_dimensions: tuple[str, ...] = ()
    cancellation_fraction: float = 0.0

    def __post_init__(self) -> None:
        _identifiers("cancellable_dimension", self.cancellable_dimensions)
        _unit_interval("cancellation_fraction", self.cancellation_fraction)
        if self.cancellation_fraction > 0.0 and not self.cancellable_dimensions:
            raise ValueError(
                "cancellation_fraction requires explicit cancellable dimensions"
            )

    def can_cancel(
        self,
        dimension_id: str,
        attractive: PressureComponent,
        repulsive: PressureComponent,
    ) -> bool:
        return (
            dimension_id in self.cancellable_dimensions
            and self.cancellation_fraction > 0.0
            and attractive.polarity is PressurePolarity.ATTRACTIVE
            and repulsive.polarity is PressurePolarity.REPULSIVE
        )

    def cancellation_amount(
        self,
        attractive: PressureComponent,
        repulsive: PressureComponent,
    ) -> float:
        return min(attractive.raw_load, repulsive.raw_load) * self.cancellation_fraction


@dataclass(frozen=True, slots=True)
class PressureContext:
    world_tick: int
    elapsed_ticks: int
    decay_policy: PressureDecayPolicy
    accumulation_policy: PressureAccumulationPolicy
    cancellation_policy: PressureCancellationPolicy

    def __post_init__(self) -> None:
        if self.world_tick < 0:
            raise ValueError("world_tick must be non-negative")
        if self.elapsed_ticks < 0:
            raise ValueError("elapsed_ticks must be non-negative")


@dataclass(frozen=True, slots=True)
class PressureContribution:
    demand_id: str
    dimension_id: str
    amount: float
    polarity: PressurePolarity
    mirror_sequence: int
    evidence_ids: tuple[str, ...]
    world_tick: int

    def __post_init__(self) -> None:
        _identifier("demand_id", self.demand_id)
        _identifier("dimension_id", self.dimension_id)
        _unit_interval("amount", self.amount)
        if self.mirror_sequence < 1:
            raise ValueError("mirror_sequence must be positive")
        _identifiers("evidence_id", self.evidence_ids)
        if self.world_tick < 0:
            raise ValueError("world_tick must be non-negative")


@dataclass(frozen=True, slots=True)
class PressureRelief:
    dimension_id: str
    amount: float
    resolved_demand_ids: tuple[str, ...]
    evidence_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _unit_interval("amount", self.amount)
        if not self.resolved_demand_ids:
            raise ValueError("resolved_demand_ids must not be empty")
        _identifiers("resolved_demand_id", self.resolved_demand_ids)
        _identifiers("evidence_id", self.evidence_ids)


@dataclass(frozen=True, slots=True)
class PressureDecay:
    dimension_id: str
    amount: float
    source_demands: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _unit_interval("amount", self.amount)
        _identifiers("source_demand", self.source_demands)


@dataclass(frozen=True, slots=True)
class PressureResult:
    node_id: str
    sequence: int
    prior_total: float
    resulting_total: float
    delta: float
    components: tuple[PressureComponent, ...]
    added: tuple[PressureContribution, ...]
    relieved: tuple[PressureRelief, ...]
    decayed: tuple[PressureDecay, ...]
    dominant_dimension: str | None
    trend: PressureTrend
    resulting_state: PressureState

    def __post_init__(self) -> None:
        _identifier("node_id", self.node_id)
        if self.sequence < 1:
            raise ValueError("sequence must be positive")
        _unit_interval("prior_total", self.prior_total)
        _unit_interval("resulting_total", self.resulting_total)
        if not isfinite(self.delta) or not -1.0 <= self.delta <= 1.0:
            raise ValueError("delta must be finite and in the range [-1, 1]")
        if self.node_id != self.resulting_state.node_id:
            raise ValueError("resulting_state must belong to node_id")
        if self.sequence != self.resulting_state.sequence:
            raise ValueError("resulting_state sequence must match result sequence")
        if self.resulting_total != self.resulting_state.total:
            raise ValueError("resulting_total must match resulting_state total")


def evaluate_pressure(
    *,
    prior: PressureState,
    mirror_output: MirrorOutput,
    context: PressureContext,
) -> PressureResult:
    """Purely evaluate pressure; evidence and topology remain outside this layer."""

    if mirror_output.node_id != prior.node_id:
        raise ValueError("MirrorOutput node_id must match PressureState node_id")
    if mirror_output.sequence <= prior.sequence:
        raise ValueError("MirrorOutput sequence is stale or duplicate")
    if context.world_tick != mirror_output.emitted_at:
        raise ValueError("PressureContext world_tick must equal MirrorOutput emitted_at")
    if context.world_tick - prior.last_evaluated_at != context.elapsed_ticks:
        raise ValueError("elapsed_ticks must match the simulation tick delta")

    components, decayed = _decay_components(
        prior.components, context.decay_policy, context.elapsed_ticks
    )
    relieved: tuple[PressureRelief, ...] = ()
    if mirror_output.transition is MirrorTransition.RESOLUTION_ACHIEVED:
        components, relieved = _relieve_components(
            components,
            mirror_output,
            context.accumulation_policy,
        )

    added: tuple[PressureContribution, ...] = ()
    if mirror_output.unresolved and mirror_output.demand is not None:
        components, added = _add_demand(
            components,
            mirror_output,
            context,
        )

    components = _apply_cancellation(components, context.cancellation_policy)
    components = tuple(component for component in components if component.raw_load > 0.0)
    total = _saturate(sum(component.raw_load for component in components))
    dominant_dimension = _dominant_dimension(components)
    source_demands = tuple(
        sorted(
            {
                demand_id
                for component in components
                for demand_id in component.source_demands
            }
        )
    )
    state = PressureState(
        node_id=prior.node_id,
        sequence=mirror_output.sequence,
        components=components,
        total=total,
        dominant_dimension=dominant_dimension,
        accumulated_since=(
            prior.accumulated_since
            if components and prior.accumulated_since is not None
            else (context.world_tick if components else None)
        ),
        last_evaluated_at=context.world_tick,
        source_demands=source_demands,
    )
    delta = total - prior.total
    return PressureResult(
        node_id=prior.node_id,
        sequence=mirror_output.sequence,
        prior_total=prior.total,
        resulting_total=total,
        delta=delta,
        components=components,
        added=added,
        relieved=relieved,
        decayed=decayed,
        dominant_dimension=dominant_dimension,
        trend=_trend(prior.total, total, bool(components)),
        resulting_state=state,
    )


def _decay_components(
    components: tuple[PressureComponent, ...],
    policy: PressureDecayPolicy,
    elapsed_ticks: int,
) -> tuple[tuple[PressureComponent, ...], tuple[PressureDecay, ...]]:
    next_components: list[PressureComponent] = []
    decayed: list[PressureDecay] = []
    for component in components:
        raw_load = policy.decay(
            component.raw_load,
            elapsed_ticks,
            component.persistence,
            component.confidence,
        )
        next_component = _component(
            dimension_id=component.dimension_id,
            raw_load=raw_load,
            polarity=component.polarity,
            persistence=component.persistence,
            confidence=component.confidence,
            source_demands=component.source_demands,
        )
        next_components.append(next_component)
        amount = component.magnitude - next_component.magnitude
        if amount > 0.0:
            decayed.append(
                PressureDecay(
                    dimension_id=component.dimension_id,
                    amount=amount,
                    source_demands=component.source_demands,
                )
            )
    return tuple(next_components), tuple(decayed)


def _relieve_components(
    components: tuple[PressureComponent, ...],
    mirror_output: MirrorOutput,
    policy: PressureAccumulationPolicy,
) -> tuple[tuple[PressureComponent, ...], tuple[PressureRelief, ...]]:
    if mirror_output.discrepancy is None:
        return components, ()
    dimensions = {
        component.dimension_id for component in mirror_output.discrepancy.dimensions
    }
    relief_fraction = min(
        1.0,
        mirror_output.coherence_delta * policy.resolution_relief_gain,
    )
    next_components: list[PressureComponent] = []
    reliefs: list[PressureRelief] = []
    for component in components:
        if component.dimension_id not in dimensions:
            next_components.append(component)
            continue
        raw_load = component.raw_load * (1.0 - relief_fraction)
        source_demands = (
            ()
            if raw_load <= 1e-12
            else component.source_demands
        )
        next_component = _component(
            dimension_id=component.dimension_id,
            raw_load=raw_load,
            polarity=component.polarity,
            persistence=component.persistence,
            confidence=component.confidence,
            source_demands=source_demands,
        )
        next_components.append(next_component)
        amount = component.magnitude - next_component.magnitude
        if amount > 0.0:
            reliefs.append(
                PressureRelief(
                    dimension_id=component.dimension_id,
                    amount=amount,
                    resolved_demand_ids=component.source_demands,
                    evidence_ids=mirror_output.evidence.evidence_ids,
                )
            )
    return tuple(next_components), tuple(reliefs)


def _add_demand(
    components: tuple[PressureComponent, ...],
    mirror_output: MirrorOutput,
    context: PressureContext,
) -> tuple[tuple[PressureComponent, ...], tuple[PressureContribution, ...]]:
    demand = mirror_output.demand
    if demand is None:
        return components, ()
    updated = {
        (component.dimension_id, component.polarity): component
        for component in components
    }
    contributions: list[PressureContribution] = []
    polarity = _pressure_polarity(demand.polarity)
    for demand_component in demand.dimensions:
        amount = context.accumulation_policy.contribution(
            demand.intensity,
            demand.specificity,
            demand.persistence,
            mirror_output.confidence,
            demand_component.weight,
        )
        if amount == 0.0:
            continue
        key = (demand_component.dimension_id, polarity)
        existing = updated.get(key)
        raw_load = amount if existing is None else existing.raw_load + amount
        source_demands = (
            (demand.demand_id,)
            if existing is None
            else tuple(sorted(set(existing.source_demands + (demand.demand_id,))))
        )
        updated[key] = _component(
            dimension_id=demand_component.dimension_id,
            raw_load=raw_load,
            polarity=polarity,
            persistence=(
                demand.persistence
                if existing is None
                else context.accumulation_policy.update_persistence(
                    existing.persistence,
                    demand.persistence,
                    context.world_tick,
                )
            ),
            confidence=(
                mirror_output.confidence
                if existing is None
                else context.accumulation_policy.update_confidence(
                    existing.confidence,
                    mirror_output.confidence,
                )
            ),
            source_demands=source_demands,
        )
        contributions.append(
            PressureContribution(
                demand_id=demand.demand_id,
                dimension_id=demand_component.dimension_id,
                amount=amount,
                polarity=polarity,
                mirror_sequence=mirror_output.sequence,
                evidence_ids=demand.derived_from,
                world_tick=context.world_tick,
            )
        )
    return tuple(updated.values()), tuple(contributions)


def _component(
    *,
    dimension_id: str,
    raw_load: float,
    polarity: PressurePolarity,
    persistence: float,
    confidence: float,
    source_demands: tuple[str, ...],
) -> PressureComponent:
    return PressureComponent(
        dimension_id=dimension_id,
        raw_load=raw_load,
        magnitude=_saturate(raw_load),
        polarity=polarity,
        persistence=persistence,
        confidence=confidence,
        source_demands=source_demands,
    )


def _apply_cancellation(
    components: tuple[PressureComponent, ...],
    policy: PressureCancellationPolicy,
) -> tuple[PressureComponent, ...]:
    updated = {
        (component.dimension_id, component.polarity): component
        for component in components
    }
    dimensions = {component.dimension_id for component in components}
    for dimension_id in dimensions:
        attractive = updated.get((dimension_id, PressurePolarity.ATTRACTIVE))
        repulsive = updated.get((dimension_id, PressurePolarity.REPULSIVE))
        if (
            attractive is None
            or repulsive is None
            or not policy.can_cancel(dimension_id, attractive, repulsive)
        ):
            continue
        amount = policy.cancellation_amount(attractive, repulsive)
        updated[(dimension_id, PressurePolarity.ATTRACTIVE)] = _component(
            dimension_id=dimension_id,
            raw_load=attractive.raw_load - amount,
            polarity=attractive.polarity,
            persistence=attractive.persistence,
            confidence=attractive.confidence,
            source_demands=attractive.source_demands,
        )
        updated[(dimension_id, PressurePolarity.REPULSIVE)] = _component(
            dimension_id=dimension_id,
            raw_load=repulsive.raw_load - amount,
            polarity=repulsive.polarity,
            persistence=repulsive.persistence,
            confidence=repulsive.confidence,
            source_demands=repulsive.source_demands,
        )
    return tuple(updated.values())


def _pressure_polarity(polarity: DemandPolarity) -> PressurePolarity:
    return {
        DemandPolarity.ATTRACT: PressurePolarity.ATTRACTIVE,
        DemandPolarity.REPEL: PressurePolarity.REPULSIVE,
        DemandPolarity.REORGANIZE: PressurePolarity.REORGANIZATIONAL,
    }[polarity]


def _dominant_dimension(components: tuple[PressureComponent, ...]) -> str | None:
    if not components:
        return None
    return max(components, key=lambda component: component.raw_load).dimension_id


def _trend(prior_total: float, total: float, has_components: bool) -> PressureTrend:
    if not has_components and prior_total == 0.0:
        return PressureTrend.NONE
    if total > prior_total:
        return PressureTrend.RISING
    if total < prior_total:
        return PressureTrend.FALLING
    return PressureTrend.STABLE
