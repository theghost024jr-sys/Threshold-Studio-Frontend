"""Evidence-backed Circuit Mirror reflection reports."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from math import isfinite


class MirrorState(str, Enum):
    DORMANT = "dormant"
    SEEKING = "seeking"
    RESONANT = "resonant"
    COHERENT = "coherent"
    DISSONANT = "dissonant"
    FRACTURED = "fractured"


class MirrorTransition(str, Enum):
    NONE = "none"
    AWAKENED = "awakened"
    DEFICIT_DISCOVERED = "deficit_discovered"
    RESONANCE_DETECTED = "resonance_detected"
    RESOLUTION_ACHIEVED = "resolution_achieved"
    CONTRADICTION_DETECTED = "contradiction_detected"
    MODEL_REVISED = "model_revised"
    FRACTURE_DETECTED = "fracture_detected"
    RECOVERED = "recovered"


class ReflectionClass(str, Enum):
    NO_EFFECT = "no_effect"
    NOISE = "noise"
    NOVEL = "novel"
    COMPATIBLE = "compatible"
    RESOLVING = "resolving"
    CONTRADICTORY = "contradictory"
    INSUFFICIENT = "insufficient"


class DiscrepancyDirection(str, Enum):
    DEFICIT = "deficit"
    SURPLUS = "surplus"
    MISALIGNMENT = "misalignment"
    CONTRADICTION = "contradiction"
    UNKNOWN = "unknown"


class DemandPolarity(str, Enum):
    ATTRACT = "attract"
    REPEL = "repel"
    REORGANIZE = "reorganize"


class DemandLineageRelation(str, Enum):
    PERSISTS = "persists"
    REFINES = "refines"
    SUPERSEDES = "supersedes"
    RESOLVES = "resolves"
    UNRELATED = "unrelated"


class RevisionReason(str, Enum):
    INVERSION = "inversion"
    EXPANSION = "expansion"
    CONTRADICTION_RESOLUTION = "contradiction_resolution"
    FRACTURE_RECOVERY = "fracture_recovery"


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _signed_unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not -1.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [-1, 1]")
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


@dataclass(frozen=True, slots=True)
class DemandLineage:
    """Evidence-backed Mirror interpretation of demand identity over time."""

    predecessor_demand_id: str
    successor_demand_id: str | None
    relation: DemandLineageRelation
    evidence_ids: tuple[str, ...]
    reflection_id: str

    def __post_init__(self) -> None:
        _identifier("predecessor_demand_id", self.predecessor_demand_id)
        _identifier("reflection_id", self.reflection_id)
        _identifiers("evidence_id", self.evidence_ids)
        if not self.evidence_ids:
            raise ValueError("evidence_ids must not be empty")
        if self.successor_demand_id is not None:
            _identifier("successor_demand_id", self.successor_demand_id)
        if self.relation is DemandLineageRelation.PERSISTS:
            if self.successor_demand_id != self.predecessor_demand_id:
                raise ValueError("PERSISTS requires the predecessor identity")
        elif self.relation is DemandLineageRelation.RESOLVES:
            if self.successor_demand_id is not None:
                raise ValueError("RESOLVES requires successor_demand_id to be None")
        elif self.relation in (
            DemandLineageRelation.REFINES,
            DemandLineageRelation.SUPERSEDES,
            DemandLineageRelation.UNRELATED,
        ) and (
            self.successor_demand_id is None
            or self.successor_demand_id == self.predecessor_demand_id
        ):
            raise ValueError(f"{self.relation.name} requires a distinct successor identity")


def _clamp(value: float) -> float:
    return min(1.0, max(0.0, value))


def _phase_distance(first: float, second: float) -> float:
    return abs(((first - second + 0.5) % 1.0) - 0.5) * 2.0


def _move_phase_toward(current: float, target: float, fraction: float) -> float:
    difference = ((target - current + 0.5) % 1.0) - 0.5
    return (current + difference * fraction) % 1.0


@dataclass(frozen=True, slots=True)
class EvidenceSummary:
    evidence_ids: tuple[str, ...]
    source_nodes: tuple[str, ...]
    observed_dimensions: tuple[str, ...]
    integrity: float
    relevance: float
    freshness: float
    comparability: float
    unavailable_dimensions: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        _identifiers("evidence_id", self.evidence_ids)
        _identifiers("source_node", self.source_nodes)
        _identifiers("observed_dimension", self.observed_dimensions)
        _identifiers("unavailable_dimension", self.unavailable_dimensions)
        for name in ("integrity", "relevance", "freshness", "comparability"):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True, slots=True)
class DiscrepancyComponent:
    dimension_id: str
    expected: float | str
    observed: float | str
    difference: float
    confidence: float

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _signed_unit_interval("difference", self.difference)
        _unit_interval("confidence", self.confidence)


@dataclass(frozen=True, slots=True)
class DiscrepancyVector:
    dimensions: tuple[DiscrepancyComponent, ...]
    magnitude: float
    direction: DiscrepancyDirection
    specificity: float

    def __post_init__(self) -> None:
        if not self.dimensions:
            raise ValueError("dimensions must not be empty")
        _unit_interval("magnitude", self.magnitude)
        _unit_interval("specificity", self.specificity)


@dataclass(frozen=True, slots=True)
class DemandComponent:
    dimension_id: str
    target: float | str
    tolerance: float
    weight: float

    def __post_init__(self) -> None:
        _identifier("dimension_id", self.dimension_id)
        _unit_interval("tolerance", self.tolerance)
        _unit_interval("weight", self.weight)


@dataclass(frozen=True, slots=True)
class DemandSignal:
    demand_id: str
    dimensions: tuple[DemandComponent, ...]
    intensity: float
    specificity: float
    persistence: float
    polarity: DemandPolarity
    derived_from: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("demand_id", self.demand_id)
        if not self.dimensions:
            raise ValueError("dimensions must not be empty")
        for name in ("intensity", "specificity", "persistence"):
            _unit_interval(name, getattr(self, name))
        if not self.derived_from:
            raise ValueError("derived_from must not be empty")
        _identifiers("evidence_id", self.derived_from)


@dataclass(frozen=True, slots=True)
class ModelRevision:
    revision_id: str
    reason: RevisionReason
    removed_claims: tuple[str, ...]
    retained_claims: tuple[str, ...]
    added_claims: tuple[str, ...]
    superseded_demand_ids: tuple[str, ...]
    replacement_demand_ids: tuple[str, ...]

    def __post_init__(self) -> None:
        _identifier("revision_id", self.revision_id)
        _identifiers("removed_claim", self.removed_claims)
        _identifiers("retained_claim", self.retained_claims)
        _identifiers("added_claim", self.added_claims)
        _identifiers("superseded_demand_id", self.superseded_demand_ids)
        _identifiers("replacement_demand_id", self.replacement_demand_ids)
        if self.reason is RevisionReason.INVERSION and not self.removed_claims:
            raise ValueError("an inversion revision must remove at least one claim")


@dataclass(frozen=True, slots=True)
class CircuitMirrorState:
    """Durable local Mirror state; transient evaluation is never persisted."""

    state: MirrorState
    resonance: float
    deficit: float
    coherence: float
    phase: float
    evidence: float
    contradiction_streak: int = 0
    claim_ids: tuple[str, ...] = ()
    active_demand_id: str | None = None

    def __post_init__(self) -> None:
        for name in ("resonance", "deficit", "coherence", "phase", "evidence"):
            _unit_interval(name, getattr(self, name))
        if self.contradiction_streak < 0:
            raise ValueError("contradiction_streak must be non-negative")
        _identifiers("claim_id", self.claim_ids)
        if self.active_demand_id is not None:
            _identifier("active_demand_id", self.active_demand_id)
        if self.state is MirrorState.DORMANT and self.deficit != 0.0:
            raise ValueError("a dormant Mirror cannot retain a deficit")


@dataclass(frozen=True, slots=True)
class CircuitMirrorSignal:
    """Slit-admitted evidence available for one transient reflection."""

    amplitude: float
    resonance: float
    coherence: float
    phase: float
    completion: float
    evidence: EvidenceSummary
    revision_evidence: float = 0.0
    dimension_id: str = "signal"

    def __post_init__(self) -> None:
        for name in (
            "amplitude",
            "resonance",
            "coherence",
            "phase",
            "completion",
            "revision_evidence",
        ):
            _unit_interval(name, getattr(self, name))
        _identifier("dimension_id", self.dimension_id)


@dataclass(frozen=True, slots=True)
class ReflectionContext:
    reflection_id: str
    node_id: str
    sequence: int
    emitted_at: int

    def __post_init__(self) -> None:
        _identifier("reflection_id", self.reflection_id)
        _identifier("node_id", self.node_id)
        if self.sequence < 1:
            raise ValueError("sequence must be greater than or equal to 1")
        if self.emitted_at < 0:
            raise ValueError("emitted_at must be non-negative")


@dataclass(frozen=True, slots=True)
class CircuitMirrorConfig:
    noise_threshold: float
    evidence_threshold: float
    resonance_threshold: float
    contradiction_threshold: float
    resolution_threshold: float
    inversion_threshold: float
    resolution_epsilon: float
    evidence_gain: float
    coherence_gain: float
    phase_reorientation_gain: float
    fracture_threshold: int

    def __post_init__(self) -> None:
        for name in (
            "noise_threshold",
            "evidence_threshold",
            "resonance_threshold",
            "contradiction_threshold",
            "resolution_threshold",
            "inversion_threshold",
            "resolution_epsilon",
            "evidence_gain",
            "coherence_gain",
            "phase_reorientation_gain",
        ):
            _unit_interval(name, getattr(self, name))
        if self.fracture_threshold < 1:
            raise ValueError("fracture_threshold must be positive")


@dataclass(frozen=True, slots=True)
class MirrorOutput:
    """Immutable evidence-backed report of one completed reflection."""

    reflection_id: str
    node_id: str
    sequence: int
    prior_state: MirrorState
    resulting_state: MirrorState
    transition: MirrorTransition
    classification: ReflectionClass
    evidence: EvidenceSummary
    discrepancy: DiscrepancyVector | None
    demand: DemandSignal | None
    resonance: float
    coherence_delta: float
    contradiction: float
    novelty: float
    confidence: float
    model_revision: ModelRevision | None
    unresolved: bool
    emitted_at: int
    demand_lineage: DemandLineage | None = None

    def __post_init__(self) -> None:
        ReflectionContext(
            reflection_id=self.reflection_id,
            node_id=self.node_id,
            sequence=self.sequence,
            emitted_at=self.emitted_at,
        )
        _unit_interval("resonance", self.resonance)
        _signed_unit_interval("coherence_delta", self.coherence_delta)
        for name in ("contradiction", "novelty", "confidence"):
            _unit_interval(name, getattr(self, name))
        if self.classification is not ReflectionClass.NO_EFFECT and not self.evidence.evidence_ids:
            raise ValueError("a meaningful classification requires evidence")
        if self.model_revision is not None and not self.evidence.evidence_ids:
            raise ValueError("a model revision requires evidence")
        if self.contradiction > 0.0 and (
            self.classification is not ReflectionClass.CONTRADICTORY
            and self.transition
            not in (MirrorTransition.MODEL_REVISED, MirrorTransition.FRACTURE_DETECTED)
        ):
            raise ValueError("contradiction requires a contradictory classification or transition")
        if self.demand is not None:
            if self.discrepancy is None:
                raise ValueError("demand requires a discrepancy")
            if not self.unresolved:
                raise ValueError("demand requires unresolved to be true")
        if self.resulting_state is MirrorState.DORMANT and self.demand is not None:
            raise ValueError("a dormant Mirror cannot emit demand")
        if self.transition is MirrorTransition.RESOLUTION_ACHIEVED:
            if self.resulting_state is not MirrorState.COHERENT:
                raise ValueError("resolution must result in coherence")
            if self.coherence_delta <= 0.0:
                raise ValueError("resolution must increase coherence")
        if self.classification is ReflectionClass.RESOLVING and self.discrepancy is None:
            raise ValueError("resolving requires a discrepancy")
        if self.resulting_state is MirrorState.FRACTURED:
            if self.contradiction <= 0.0 or self.coherence_delta >= 0.0:
                raise ValueError("fracture requires contradiction and coherence loss")
            if self.demand is not None and self.demand.polarity is not DemandPolarity.REORGANIZE:
                raise ValueError("fractured demand must request reorganization")
        if self.transition is MirrorTransition.MODEL_REVISED and self.model_revision is None:
            raise ValueError("model revision transition requires a model_revision")
        if self.model_revision is not None and self.resulting_state is MirrorState.DORMANT:
            raise ValueError("a model revision cannot result in dormancy")
        lineage = self.demand_lineage
        if lineage is not None:
            if lineage.reflection_id != self.reflection_id:
                raise ValueError("demand_lineage.reflection_id must match reflection_id")
            if not set(lineage.evidence_ids).issubset(self.evidence.evidence_ids):
                raise ValueError(
                    "demand_lineage evidence must be backed by MirrorOutput evidence"
                )
            if lineage.relation is DemandLineageRelation.RESOLVES:
                if self.demand is not None:
                    raise ValueError("RESOLVES lineage requires demand to be None")
                if lineage.successor_demand_id is not None:
                    raise ValueError("RESOLVES lineage cannot have a successor demand")
            elif self.demand is None:
                raise ValueError(f"{lineage.relation.name} lineage requires an active demand")
            elif lineage.successor_demand_id != self.demand.demand_id:
                raise ValueError(f"{lineage.relation.name} successor must match output demand")
        if (
            self.transition is MirrorTransition.RESOLUTION_ACHIEVED
            and lineage is not None
            and lineage.relation is not DemandLineageRelation.RESOLVES
        ):
            raise ValueError("resolution transition may only carry RESOLVES lineage")


@dataclass(frozen=True, slots=True)
class CircuitMirrorReflection:
    """Engine transition containing the report and the next durable state."""

    output: MirrorOutput
    next_state: CircuitMirrorState


def reflect_circuit_mirror(
    state: CircuitMirrorState,
    signal: CircuitMirrorSignal,
    context: ReflectionContext,
    config: CircuitMirrorConfig,
) -> CircuitMirrorReflection:
    """Evaluate one transient contact without persisting an EXPOSED state."""

    support = min(
        signal.evidence.integrity,
        signal.evidence.relevance,
        signal.evidence.freshness,
        signal.evidence.comparability,
    )
    if not signal.evidence.evidence_ids or support < config.evidence_threshold:
        return _report(
            state,
            state,
            context,
            signal.evidence,
            MirrorTransition.NONE,
            ReflectionClass.INSUFFICIENT,
            confidence=0.0,
        )
    if signal.amplitude <= config.noise_threshold:
        return _report(
            state,
            state,
            context,
            signal.evidence,
            MirrorTransition.NONE,
            ReflectionClass.NOISE,
        )

    match = _structural_match(state, signal)
    phase_difference = _phase_distance(state.phase, signal.phase)
    difference = signal.amplitude * ((1.0 - match) + phase_difference) / 2.0
    evidence = _clamp(state.evidence + signal.amplitude * config.evidence_gain)
    novelty = 1.0 - match
    discrepancy = _discrepancy(signal, difference, match, DiscrepancyDirection.DEFICIT)

    if _can_resolve(state, signal, match, phase_difference, config):
        deficit = max(0.0, state.deficit - signal.amplitude * signal.completion)
        resulting_state = (
            MirrorState.COHERENT
            if deficit <= config.resolution_epsilon
            else MirrorState.SEEKING
        )
        next_state = CircuitMirrorState(
            state=resulting_state,
            resonance=_clamp(state.resonance + match * config.coherence_gain),
            deficit=deficit,
            coherence=_clamp(state.coherence + signal.completion * config.coherence_gain),
            phase=state.phase,
            evidence=evidence,
            claim_ids=state.claim_ids,
        )
        transition = (
            MirrorTransition.RESOLUTION_ACHIEVED
            if resulting_state is MirrorState.COHERENT
            else MirrorTransition.DEFICIT_DISCOVERED
        )
        return _report(
            state,
            next_state,
            context,
            signal.evidence,
            transition,
            ReflectionClass.RESOLVING,
            discrepancy=discrepancy,
            novelty=novelty,
            coherence_delta=next_state.coherence - state.coherence,
        )

    if (
        state.state in (MirrorState.DISSONANT, MirrorState.FRACTURED)
        and state.claim_ids
        and signal.revision_evidence >= config.inversion_threshold
    ):
        revised_phase = _move_phase_toward(
            state.phase, signal.phase, config.phase_reorientation_gain
        )
        revised_difference = signal.amplitude * (
            (1.0 - match) + _phase_distance(revised_phase, signal.phase)
        ) / 2.0
        resulting_state = (
            MirrorState.COHERENT
            if revised_difference <= config.resolution_epsilon
            else MirrorState.SEEKING
        )
        demand_id = _demand_id(context)
        demand = (
            None
            if resulting_state is MirrorState.COHERENT
            else _demand(
                demand_id,
                signal,
                revised_difference,
                evidence,
                DemandPolarity.REORGANIZE,
            )
        )
        next_state = CircuitMirrorState(
            state=resulting_state,
            resonance=_clamp(state.resonance + match * config.coherence_gain),
            deficit=revised_difference,
            coherence=_clamp(
                state.coherence + signal.revision_evidence * config.coherence_gain
            ),
            phase=revised_phase,
            evidence=evidence,
            claim_ids=(f"claim:{context.reflection_id}",),
            active_demand_id=demand.demand_id if demand else None,
        )
        revision = ModelRevision(
            revision_id=f"revision:{context.reflection_id}",
            reason=RevisionReason.INVERSION,
            removed_claims=state.claim_ids,
            retained_claims=(),
            added_claims=next_state.claim_ids,
            superseded_demand_ids=(
                (state.active_demand_id,) if state.active_demand_id else ()
            ),
            replacement_demand_ids=(demand_id,) if demand else (),
        )
        return _report(
            state,
            next_state,
            context,
            signal.evidence,
            MirrorTransition.MODEL_REVISED,
            ReflectionClass.CONTRADICTORY,
            discrepancy=_discrepancy(
                signal, revised_difference, match, DiscrepancyDirection.MISALIGNMENT
            ),
            demand=demand,
            novelty=novelty,
            coherence_delta=next_state.coherence - state.coherence,
            revision=revision,
        )

    if difference >= config.contradiction_threshold:
        streak = state.contradiction_streak + 1
        resulting_state = (
            MirrorState.FRACTURED
            if streak >= config.fracture_threshold
            else MirrorState.DISSONANT
        )
        next_state = CircuitMirrorState(
            state=resulting_state,
            resonance=state.resonance,
            deficit=max(state.deficit, difference),
            coherence=_clamp(state.coherence - difference * config.coherence_gain),
            phase=state.phase,
            evidence=evidence,
            contradiction_streak=streak,
            claim_ids=state.claim_ids,
        )
        return _report(
            state,
            next_state,
            context,
            signal.evidence,
            (
                MirrorTransition.FRACTURE_DETECTED
                if resulting_state is MirrorState.FRACTURED
                else MirrorTransition.CONTRADICTION_DETECTED
            ),
            ReflectionClass.CONTRADICTORY,
            discrepancy=_discrepancy(
                signal, difference, match, DiscrepancyDirection.CONTRADICTION
            ),
            novelty=novelty,
            coherence_delta=next_state.coherence - state.coherence,
            contradiction=difference,
        )

    if difference <= config.resolution_epsilon and state.deficit == 0.0:
        return _report(
            state,
            state,
            context,
            signal.evidence,
            MirrorTransition.NONE,
            ReflectionClass.NO_EFFECT,
            novelty=novelty,
        )

    resulting_state = (
        MirrorState.RESONANT if match >= config.resonance_threshold else MirrorState.SEEKING
    )
    next_state = CircuitMirrorState(
        state=resulting_state,
        resonance=_clamp(state.resonance + match * config.coherence_gain),
        deficit=max(state.deficit, difference),
        coherence=_clamp(state.coherence + match * config.coherence_gain),
        phase=state.phase,
        evidence=evidence,
        claim_ids=state.claim_ids,
        active_demand_id=_demand_id(context),
    )
    transition = (
        MirrorTransition.AWAKENED
        if state.state is MirrorState.DORMANT
        else (
            MirrorTransition.RESONANCE_DETECTED
            if resulting_state is MirrorState.RESONANT
            else MirrorTransition.DEFICIT_DISCOVERED
        )
    )
    classification = (
        ReflectionClass.COMPATIBLE
        if resulting_state is MirrorState.RESONANT
        else ReflectionClass.NOVEL
    )
    return _report(
        state,
        next_state,
        context,
        signal.evidence,
        transition,
        classification,
        discrepancy=discrepancy,
        demand=_demand(
            next_state.active_demand_id,
            signal,
            next_state.deficit * difference,
            evidence,
            DemandPolarity.ATTRACT,
        ),
        novelty=novelty,
        coherence_delta=next_state.coherence - state.coherence,
    )


def _structural_match(state: CircuitMirrorState, signal: CircuitMirrorSignal) -> float:
    return (
        1.0 - abs(signal.resonance - state.resonance)
        + 1.0 - abs(signal.coherence - state.coherence)
    ) / 2.0


def _can_resolve(
    state: CircuitMirrorState,
    signal: CircuitMirrorSignal,
    match: float,
    phase_difference: float,
    config: CircuitMirrorConfig,
) -> bool:
    return (
        state.deficit > 0.0
        and signal.completion >= config.resolution_threshold
        and match >= config.resonance_threshold
        and phase_difference < config.contradiction_threshold
    )


def _discrepancy(
    signal: CircuitMirrorSignal,
    magnitude: float,
    match: float,
    direction: DiscrepancyDirection,
) -> DiscrepancyVector:
    return DiscrepancyVector(
        dimensions=(
            DiscrepancyComponent(
                dimension_id=signal.dimension_id,
                expected=signal.resonance,
                observed=signal.coherence,
                difference=signal.coherence - signal.resonance,
                confidence=match,
            ),
        ),
        magnitude=magnitude,
        direction=direction,
        specificity=match,
    )


def _demand_id(context: ReflectionContext) -> str:
    return f"demand:{context.reflection_id}"


def _demand(
    demand_id: str | None,
    signal: CircuitMirrorSignal,
    intensity: float,
    evidence: float,
    polarity: DemandPolarity,
) -> DemandSignal:
    if demand_id is None:
        raise ValueError("demand_id must be present when constructing demand")
    return DemandSignal(
        demand_id=demand_id,
        dimensions=(
            DemandComponent(
                dimension_id=signal.dimension_id,
                target=signal.resonance,
                tolerance=1.0 - signal.completion,
                weight=1.0,
            ),
        ),
        intensity=intensity,
        specificity=signal.evidence.comparability,
        persistence=evidence,
        polarity=polarity,
        derived_from=signal.evidence.evidence_ids,
    )


def _report(
    prior: CircuitMirrorState,
    next_state: CircuitMirrorState,
    context: ReflectionContext,
    evidence: EvidenceSummary,
    transition: MirrorTransition,
    classification: ReflectionClass,
    *,
    discrepancy: DiscrepancyVector | None = None,
    demand: DemandSignal | None = None,
    novelty: float = 0.0,
    coherence_delta: float = 0.0,
    contradiction: float = 0.0,
    revision: ModelRevision | None = None,
    confidence: float | None = None,
) -> CircuitMirrorReflection:
    output = MirrorOutput(
        reflection_id=context.reflection_id,
        node_id=context.node_id,
        sequence=context.sequence,
        prior_state=prior.state,
        resulting_state=next_state.state,
        transition=transition,
        classification=classification,
        evidence=evidence,
        discrepancy=discrepancy,
        demand=demand,
        resonance=next_state.resonance if discrepancy is not None else 0.0,
        coherence_delta=coherence_delta,
        contradiction=contradiction,
        novelty=novelty,
        confidence=(
            min(
                evidence.integrity,
                evidence.relevance,
                evidence.freshness,
                evidence.comparability,
            )
            if confidence is None and evidence.evidence_ids
            else (0.0 if confidence is None else confidence)
        ),
        model_revision=revision,
        unresolved=next_state.state
        in (MirrorState.SEEKING, MirrorState.RESONANT, MirrorState.DISSONANT, MirrorState.FRACTURED),
        emitted_at=context.emitted_at,
    )
    return CircuitMirrorReflection(output=output, next_state=next_state)
