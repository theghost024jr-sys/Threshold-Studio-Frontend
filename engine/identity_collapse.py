"""Identity collapse thresholds derived from basin capacity and effective pressure."""

from __future__ import annotations

from dataclasses import dataclass
from math import isfinite

from .basins import IdentityBasin
from .identity_pressure import IdentityPressureReading


def _unit_interval(name: str, value: float) -> float:
    if not isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"{name} must be finite and in the range [0, 1]")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be finite and non-negative")
    return value


@dataclass(frozen=True)
class IdentityCollapseConfig:
    """Curvature normalization and bounded Hesitation Zone pressure deferral."""

    curvature_reference: float
    hesitation_strength: float

    def __post_init__(self) -> None:
        if not isfinite(self.curvature_reference) or self.curvature_reference <= 0.0:
            raise ValueError("curvature_reference must be finite and greater than 0")
        if (
            not isfinite(self.hesitation_strength)
            or not 0.0 <= self.hesitation_strength < 1.0
        ):
            raise ValueError("hesitation_strength must be finite and in the range [0, 1)")


@dataclass(frozen=True)
class IdentityCollapseThreshold:
    """The capacity comparison for one identity at one basin in the current tick."""

    identity_id: str
    basin_id: str
    current_pressure: float
    effective_pressure: float
    capacity: float
    curvature_factor: float
    coherence_factor: float
    triggered: bool
    overload: float


def evaluate_identity_collapse(
    *,
    reading: IdentityPressureReading,
    basin: IdentityBasin,
    collapse_immunity: float,
    hesitation_activation: float,
    uncertainty: float,
    config: IdentityCollapseConfig,
) -> IdentityCollapseThreshold:
    """Apply ``P_effective > depth * curvature * immunity * (1 - uncertainty)``."""

    if reading.basin_id != basin.basin_id:
        raise ValueError("reading basin_id must match basin basin_id")
    _unit_interval("collapse_immunity", collapse_immunity)
    _unit_interval("hesitation_activation", hesitation_activation)
    _unit_interval("uncertainty", uncertainty)

    current_pressure = reading.total_pressure
    curvature_factor = min(1.0, max(0.0, basin.curvature / config.curvature_reference))
    coherence_factor = 1.0 - uncertainty
    effective_pressure = current_pressure * (
        1.0 - config.hesitation_strength * hesitation_activation
    )
    capacity = basin.depth * curvature_factor * collapse_immunity * coherence_factor
    overload = max(0.0, effective_pressure - capacity)
    return IdentityCollapseThreshold(
        identity_id=reading.identity_id,
        basin_id=basin.basin_id,
        current_pressure=current_pressure,
        effective_pressure=effective_pressure,
        capacity=capacity,
        curvature_factor=curvature_factor,
        coherence_factor=coherence_factor,
        triggered=effective_pressure > capacity,
        overload=overload,
    )
