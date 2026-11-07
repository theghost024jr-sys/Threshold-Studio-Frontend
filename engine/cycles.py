"""World-scale collapse and rebirth state transitions."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite
from typing import Literal

GardenCyclePhase = Literal[
    "distortion", "drift", "field", "collapse", "identity", "role", "signal"
]


def _finite(name: str, value: float) -> float:
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class GardenCycleMetrics:
    pressure_gradient: float
    pressure_derivative: float
    pressure_spread: float
    collapse_wave: float
    immunity: float
    macro_curvature: float
    pressure: float
    pressure_target: float
    resonance_spread: float

    def __post_init__(self) -> None:
        for name in (
            "pressure_gradient",
            "pressure_spread",
            "collapse_wave",
            "immunity",
            "resonance_spread",
        ):
            _non_negative(name, getattr(self, name))
        for name in (
            "pressure_derivative",
            "macro_curvature",
            "pressure",
            "pressure_target",
        ):
            _finite(name, getattr(self, name))


@dataclass(frozen=True)
class GardenCycleConfig:
    distortion_gradient_threshold: float
    field_uniformity_tolerance: float
    role_pressure_tolerance: float
    signal_resonance_tolerance: float

    def __post_init__(self) -> None:
        for name in (
            "distortion_gradient_threshold",
            "field_uniformity_tolerance",
            "role_pressure_tolerance",
            "signal_resonance_tolerance",
        ):
            _non_negative(name, getattr(self, name))


def advance_garden_cycle(
    phase: GardenCyclePhase,
    metrics: GardenCycleMetrics,
    config: GardenCycleConfig,
) -> GardenCyclePhase:
    """Advance one ordered Garden metabolism phase using canonical triggers."""

    if phase == "distortion":
        return "drift" if metrics.pressure_derivative < 0.0 else phase
    if phase == "drift":
        return "field" if metrics.pressure_spread <= config.field_uniformity_tolerance else phase
    if phase == "field":
        if metrics.collapse_wave > metrics.immunity:
            return "collapse"
        return "identity" if metrics.macro_curvature > 0.0 else phase
    if phase == "collapse":
        return "identity" if metrics.macro_curvature > 0.0 else phase
    if phase == "identity":
        return (
            "role"
            if abs(metrics.pressure - metrics.pressure_target)
            <= config.role_pressure_tolerance
            else phase
        )
    if phase == "role":
        return (
            "signal"
            if metrics.resonance_spread <= config.signal_resonance_tolerance
            else phase
        )
    return "distortion" if metrics.pressure_gradient > config.distortion_gradient_threshold else phase
