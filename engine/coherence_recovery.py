"""Functional stability for incomplete local signals."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

from .unresolved import UnresolvedField


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


@dataclass(frozen=True)
class CoherenceRecoverySignals:
    """Normalized signals that let a zone stabilize without resolving doubt."""

    unresolved: UnresolvedField
    misalignment_memory: float
    grief_weight: float
    refusal_active: bool
    hesitation_border: float
    false_warden_signal: float
    failed_elevation: float
    aborted_topology_rewrite: float

    def __post_init__(self) -> None:
        for name in (
            "misalignment_memory",
            "grief_weight",
            "hesitation_border",
            "false_warden_signal",
            "failed_elevation",
            "aborted_topology_rewrite",
        ):
            _unit_interval(name, getattr(self, name))


@dataclass(frozen=True)
class CoherenceRecoveryConfig:
    unresolved_weight: float
    misalignment_memory_weight: float
    grief_weight: float
    refusal_weight: float
    hesitation_border_weight: float
    false_warden_weight: float
    failed_elevation_weight: float
    aborted_topology_weight: float
    resonance_jitter_damping_coefficient: float
    pressure_spike_damping_coefficient: float
    flow_stutter_damping_coefficient: float
    collapse_flicker_damping_coefficient: float
    polarity_oscillation_damping_coefficient: float

    def __post_init__(self) -> None:
        for name in (
            "unresolved_weight",
            "misalignment_memory_weight",
            "grief_weight",
            "refusal_weight",
            "hesitation_border_weight",
            "false_warden_weight",
            "failed_elevation_weight",
            "aborted_topology_weight",
        ):
            _non_negative(name, getattr(self, name))
        if self.total_weight == 0.0:
            raise ValueError("at least one coherence-recovery weight must be positive")
        for name in (
            "resonance_jitter_damping_coefficient",
            "pressure_spike_damping_coefficient",
            "flow_stutter_damping_coefficient",
            "collapse_flicker_damping_coefficient",
            "polarity_oscillation_damping_coefficient",
        ):
            _unit_interval(name, getattr(self, name))

    @property
    def total_weight(self) -> float:
        return sum(
            (
                self.unresolved_weight,
                self.misalignment_memory_weight,
                self.grief_weight,
                self.refusal_weight,
                self.hesitation_border_weight,
                self.false_warden_weight,
                self.failed_elevation_weight,
                self.aborted_topology_weight,
            )
        )


@dataclass(frozen=True)
class CoherenceRecovery:
    """Bounded stabilization that does not resolve or erase its source signals."""

    value: float
    resonance_jitter_damping: float
    pressure_spike_damping: float
    flow_stutter_damping: float
    collapse_flicker_damping: float
    polarity_oscillation_damping: float

    def __post_init__(self) -> None:
        for name in (
            "value",
            "resonance_jitter_damping",
            "pressure_spike_damping",
            "flow_stutter_damping",
            "collapse_flicker_damping",
            "polarity_oscillation_damping",
        ):
            _unit_interval(name, getattr(self, name))


def calculate_coherence_recovery(
    signals: CoherenceRecoverySignals,
    config: CoherenceRecoveryConfig,
) -> CoherenceRecovery:
    """Calculate functional stability while keeping every source signal intact."""

    weighted_sum = (
        signals.unresolved.value * config.unresolved_weight
        + signals.misalignment_memory * config.misalignment_memory_weight
        + signals.grief_weight * config.grief_weight
        + float(signals.refusal_active) * config.refusal_weight
        + signals.hesitation_border * config.hesitation_border_weight
        + signals.false_warden_signal * config.false_warden_weight
        + signals.failed_elevation * config.failed_elevation_weight
        + signals.aborted_topology_rewrite * config.aborted_topology_weight
    )
    value = weighted_sum / config.total_weight
    return CoherenceRecovery(
        value=value,
        resonance_jitter_damping=value
        * config.resonance_jitter_damping_coefficient,
        pressure_spike_damping=value
        * config.pressure_spike_damping_coefficient,
        flow_stutter_damping=value * config.flow_stutter_damping_coefficient,
        collapse_flicker_damping=value
        * config.collapse_flicker_damping_coefficient,
        polarity_oscillation_damping=value
        * config.polarity_oscillation_damping_coefficient,
    )
