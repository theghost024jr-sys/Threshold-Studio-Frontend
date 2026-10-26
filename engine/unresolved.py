"""Negative-capability fields that retain incomplete world-state coherence."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


@dataclass(frozen=True)
class UnresolvedSignals:
    """Normalized force pairs that may rise without reaching a resolution."""

    density: float
    shimmer: float
    pressure: float
    resonance: float
    identity_lock: float
    collapse_scars: float
    funnelization: float
    polarity: float
    slit_openness: float
    memory: float
    memory_identity_coherence: float

    def __post_init__(self) -> None:
        for name in (
            "density",
            "shimmer",
            "pressure",
            "resonance",
            "identity_lock",
            "collapse_scars",
            "funnelization",
            "polarity",
            "slit_openness",
            "memory",
            "memory_identity_coherence",
        ):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True)
class UnresolvedFieldConfig:
    density_without_shimmer_weight: float
    pressure_without_resonance_weight: float
    resonance_without_identity_weight: float
    scars_without_funnel_weight: float
    polarity_with_closed_slit_weight: float
    memory_without_identity_weight: float

    def __post_init__(self) -> None:
        for name in (
            "density_without_shimmer_weight",
            "pressure_without_resonance_weight",
            "resonance_without_identity_weight",
            "scars_without_funnel_weight",
            "polarity_with_closed_slit_weight",
            "memory_without_identity_weight",
        ):
            _non_negative(name, getattr(self, name))
        if self.total_weight == 0.0:
            raise ValueError("at least one unresolved-field weight must be positive")

    @property
    def total_weight(self) -> float:
        return sum(
            (
                self.density_without_shimmer_weight,
                self.pressure_without_resonance_weight,
                self.resonance_without_identity_weight,
                self.scars_without_funnel_weight,
                self.polarity_with_closed_slit_weight,
                self.memory_without_identity_weight,
            )
        )


@dataclass(frozen=True)
class UnresolvedField:
    """A local, normalized measure of forces held without forced resolution."""

    value: float
    density_without_shimmer: float
    pressure_without_resonance: float
    resonance_without_identity: float
    scars_without_funnel: float
    polarity_with_closed_slit: float
    memory_without_identity: float

    def __post_init__(self) -> None:
        for name in (
            "value",
            "density_without_shimmer",
            "pressure_without_resonance",
            "resonance_without_identity",
            "scars_without_funnel",
            "polarity_with_closed_slit",
            "memory_without_identity",
        ):
            _unit_interval(name, getattr(self, name))


def calculate_unresolved_field(
    signals: UnresolvedSignals, config: UnresolvedFieldConfig
) -> UnresolvedField:
    """Measure active force that is present without its usual resolving response."""

    density_without_shimmer = signals.density * (1.0 - signals.shimmer)
    pressure_without_resonance = signals.pressure * (1.0 - signals.resonance)
    resonance_without_identity = signals.resonance * (1.0 - signals.identity_lock)
    scars_without_funnel = signals.collapse_scars * (1.0 - signals.funnelization)
    polarity_with_closed_slit = signals.polarity * (1.0 - signals.slit_openness)
    memory_without_identity = signals.memory * (
        1.0 - signals.memory_identity_coherence
    )
    value = sum(
        (
            density_without_shimmer * config.density_without_shimmer_weight,
            pressure_without_resonance
            * config.pressure_without_resonance_weight,
            resonance_without_identity
            * config.resonance_without_identity_weight,
            scars_without_funnel * config.scars_without_funnel_weight,
            polarity_with_closed_slit * config.polarity_with_closed_slit_weight,
            memory_without_identity * config.memory_without_identity_weight,
        )
    ) / config.total_weight
    return UnresolvedField(
        value=value,
        density_without_shimmer=density_without_shimmer,
        pressure_without_resonance=pressure_without_resonance,
        resonance_without_identity=resonance_without_identity,
        scars_without_funnel=scars_without_funnel,
        polarity_with_closed_slit=polarity_with_closed_slit,
        memory_without_identity=memory_without_identity,
    )
