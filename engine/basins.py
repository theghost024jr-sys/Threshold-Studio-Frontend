"""Pressure-topology primitives for Flower identity basins."""

from __future__ import annotations

from dataclasses import dataclass, replace
from math import isfinite
from typing import Literal, Sequence

BasinRole = Literal["core", "frontier", "halo", "saddle", "unclassified"]


def _finite(name: str, value: float) -> float:
    if not isfinite(value):
        raise ValueError(f"{name} must be finite")
    return value


def _non_negative(name: str, value: float) -> float:
    if not isfinite(value) or value < 0.0:
        raise ValueError(f"{name} must be a finite value greater than or equal to 0")
    return value


@dataclass(frozen=True)
class IdentityBasin:
    """A local pressure minimum and its behavioral topology."""

    basin_id: str
    center_pressure: float
    rim_pressure: float
    curvature: float
    orbit_radius: float

    def __post_init__(self) -> None:
        if not self.basin_id.strip():
            raise ValueError("basin_id must not be empty")
        _non_negative("center_pressure", self.center_pressure)
        _non_negative("rim_pressure", self.rim_pressure)
        _finite("curvature", self.curvature)
        _non_negative("orbit_radius", self.orbit_radius)
        if self.rim_pressure < self.center_pressure:
            raise ValueError("rim_pressure must be greater than or equal to center_pressure")

    @property
    def depth(self) -> float:
        """Return the basin's pressure barrier above its center."""

        return self.rim_pressure - self.center_pressure


def is_local_minimum(center_pressure: float, neighboring_pressures: Sequence[float]) -> bool:
    """Return whether a sampled point is strictly lower than every neighbor."""

    _non_negative("center_pressure", center_pressure)
    if not neighboring_pressures:
        raise ValueError("neighboring_pressures must not be empty")
    for pressure in neighboring_pressures:
        _non_negative("neighboring pressure", pressure)
    return all(center_pressure < pressure for pressure in neighboring_pressures)


def classify_basin_role(basin: IdentityBasin) -> BasinRole:
    """Classify a basin from curvature and its Fib orbit band."""

    if basin.curvature < 0.0:
        return "saddle"
    if basin.orbit_radius <= 3.0:
        return "core"
    if 5.0 <= basin.orbit_radius <= 8.0:
        return "frontier"
    if basin.orbit_radius >= 13.0:
        return "halo"
    return "unclassified"


def crosses_basin_rim(
    previous_pressure: float, next_pressure: float, rim_pressure: float
) -> bool:
    """Return whether a pressure trajectory crosses a basin's rim in either direction."""

    _non_negative("previous_pressure", previous_pressure)
    _non_negative("next_pressure", next_pressure)
    _non_negative("rim_pressure", rim_pressure)
    return (previous_pressure < rim_pressure <= next_pressure) or (
        previous_pressure >= rim_pressure > next_pressure
    )


def deform_basin(
    basin: IdentityBasin,
    center_storm_amplitude: float,
    rim_storm_amplitude: float,
    spirit_alignment: float,
    spirit_pressure_coefficient: float,
) -> IdentityBasin:
    """Apply storm addition and spirit pressure scaling to a basin topology.

    Storms deform center and rim samples independently. Spirit inheritance
    scales both samples by ``1 + coefficient * alignment``. Negative pressure
    is clamped to zero to preserve pressure's non-negative engine invariant.
    """

    _finite("center_storm_amplitude", center_storm_amplitude)
    _finite("rim_storm_amplitude", rim_storm_amplitude)
    if not 0.0 <= spirit_alignment <= 1.0 or not isfinite(spirit_alignment):
        raise ValueError("spirit_alignment must be a finite value in the range [0, 1]")
    _non_negative("spirit_pressure_coefficient", spirit_pressure_coefficient)

    multiplier = 1.0 + spirit_pressure_coefficient * spirit_alignment
    center_pressure = max(0.0, (basin.center_pressure + center_storm_amplitude) * multiplier)
    rim_pressure = max(0.0, (basin.rim_pressure + rim_storm_amplitude) * multiplier)
    if rim_pressure < center_pressure:
        rim_pressure = center_pressure
    return replace(
        basin,
        center_pressure=center_pressure,
        rim_pressure=rim_pressure,
    )
