"""Pressure-driven Garden era transition mechanics."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

EraPhase = Literal["distortion", "drift", "field", "collapse", "reformation", "alignment", "signal"]


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class EraTransitionConfig:
    pressure_gradient_threshold: float
    resonance_drift_threshold: float
    migration_surge_threshold: float
    spirit_shift_threshold: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_gradient_threshold",
            "resonance_drift_threshold",
            "migration_surge_threshold",
            "spirit_shift_threshold",
        ):
            _non_negative(name, getattr(self, name))


@dataclass(frozen=True)
class EraTransitionMetrics:
    pressure_gradient: float
    resonance_drift: float
    macro_curvature: float
    migration_surge: float
    collapse_wave: float
    immunity: float
    spirit_alignment_shift: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_gradient",
            "resonance_drift",
            "migration_surge",
            "collapse_wave",
            "immunity",
            "spirit_alignment_shift",
        ):
            _non_negative(name, getattr(self, name))
        if not isfinite(self.macro_curvature):
            raise ValueError("macro_curvature must be finite")


def era_transition_ignites(
    metrics: EraTransitionMetrics, config: EraTransitionConfig
) -> bool:
    """Return whether any canonical world-scale reset trigger is active."""

    return (
        metrics.pressure_gradient > config.pressure_gradient_threshold
        or metrics.resonance_drift > config.resonance_drift_threshold
        or metrics.macro_curvature < 0.0
        or metrics.migration_surge > config.migration_surge_threshold
        or metrics.collapse_wave > metrics.immunity
        or metrics.spirit_alignment_shift > config.spirit_shift_threshold
    )


def advance_era_phase(phase: EraPhase, transition_active: bool) -> EraPhase:
    """Advance the canonical era loop; signal holds until the next ignition."""

    phases: tuple[EraPhase, ...] = (
        "distortion", "drift", "field", "collapse", "reformation", "alignment", "signal"
    )
    if phase == "signal":
        return "distortion" if transition_active else phase
    return phases[phases.index(phase) + 1]
